<?php

namespace App\Console\Commands;

use App\Jobs\CalculateSmartJob;
use App\Models\Player;
use App\Services\MetaAdaptabilityService;
use App\Services\PlayerRoleProfileService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class RecalculateRoleProfiles extends Command
{
    protected $signature = 'metrics:recalculate-role-profiles
                            {--player= : Recalculate one player UUID}
                            {--ign= : Recalculate one player by exact IGN}
                            {--dry-run : Preview classifications without writing data}
                            {--details : Include role-level evidence in dry-run output}
                            {--without-adaptability : Skip Meta Adaptability v2}
                            {--without-smart : Do not refresh SMART results after recalculation}';

    protected $description = 'Rebuild primary roles, Flex archetypes, evidence, and meta adaptability';

    public function handle(
        PlayerRoleProfileService $roleProfiles,
        MetaAdaptabilityService $metaAdaptability
    ): int {
        $query = Player::query()->orderBy('id');
        if ($playerId = $this->option('player')) {
            $query->where('id', $playerId);
        }
        if ($ign = $this->option('ign')) {
            $query->whereRaw('LOWER(ign) = ?', [mb_strtolower((string) $ign)]);
        }

        $total = (clone $query)->count();
        $playerIds = (clone $query)->pluck('id')->all();
        if ($total === 0) {
            $this->warn('No players matched the requested scope.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $profiles = [];
            $rows = $query->get()->map(function (Player $player) use (
                $roleProfiles,
                $metaAdaptability,
                &$profiles
            ): array {
                $profile = $roleProfiles->calculateForPlayer($player->id, $player->current_role);
                $adaptability = $this->option('without-adaptability')
                    ? null
                    : $metaAdaptability->calculateForPlayer($player->id, (float) $profile['flex_score']);
                $profiles[$player->ign] = [
                    'role' => $profile,
                    'adaptability' => $adaptability,
                ];

                return [
                    $player->ign,
                    $profile['primary_role'],
                    $profile['archetype'],
                    number_format((float) $profile['flex_score'], 1),
                    $profile['confidence'],
                    $profile['evidence']['map_count'],
                    $profile['evidence']['qualified_role_count'],
                    $profile['evidence']['qualified_agent_count'],
                    $profile['evidence']['event_count'],
                    $profile['evidence']['patch_count'],
                    $adaptability === null ? 'skipped' : number_format((float) $adaptability['score'], 1),
                    $adaptability['confidence'] ?? 'skipped',
                ];
            })->all();

            $this->table(
                ['IGN', 'Primary', 'Archetype', 'Flex', 'Confidence', 'Maps', 'Roles', 'Agents', 'Events', 'Patches', 'Adapt', 'A-Conf'],
                $rows
            );

            if ($this->option('details')) {
                foreach ($profiles as $ign => $profilesForPlayer) {
                    $profile = $profilesForPlayer['role'];
                    $this->newLine();
                    $this->line("Role evidence for {$ign}");
                    $this->table(
                        ['Role', 'Maps', 'Share', 'Agents', 'Events', 'Patches', 'Performance', 'Qualified', 'Repeatable'],
                        array_map(fn (array $role): array => [
                            $role['role'],
                            $role['map_count'],
                            number_format((float) $role['share'], 1).'%',
                            $role['agent_count'],
                            $role['event_count'],
                            $role['patch_count'],
                            number_format((float) $role['performance_score'], 1),
                            $role['qualified'] ? 'yes' : 'no',
                            $role['repeatable'] ? 'yes' : 'no',
                        ], $profile['role_distribution'])
                    );
                }
            }

            return self::SUCCESS;
        }

        $progress = $this->output->createProgressBar($total);
        $progress->start();

        $query->chunkById(100, function ($players) use ($roleProfiles, $metaAdaptability, $progress): void {
            foreach ($players as $player) {
                $roleProfiles->refresh($player);
                if (! $this->option('without-adaptability')) {
                    $player->refresh();
                    $metaAdaptability->refresh($player);
                }
                $progress->advance();
            }
        });

        $progress->finish();
        if (! $this->option('without-smart') && $playerIds !== []) {
            CalculateSmartJob::dispatchSync(
                'role-profile-v2-'.now()->format('YmdHis'),
                $playerIds,
                false
            );
        }

        $cacheVersion = microtime(true);
        Cache::put('api_admin_cache_version', $cacheVersion);
        Cache::put('api_smart_calc_version', $cacheVersion);
        $this->newLine(2);
        $this->info("Recalculated {$total} player role profile(s).");

        return self::SUCCESS;
    }
}
