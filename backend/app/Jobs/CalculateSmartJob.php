<?php

namespace App\Jobs;

use App\Models\Player;
use App\Services\CompetitionQualityConfig;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CalculateSmartJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $matchId;

    public $players;

    public $refreshPlayerProfiles;

    public function __construct(string $matchId, array $players, bool $refreshPlayerProfiles = true)
    {
        $this->matchId = $matchId;
        $this->players = $players;
        $this->refreshPlayerProfiles = $refreshPlayerProfiles;
    }

    public function handle(): void
    {
        // Get global active weight profiles
        $profiles = DB::table('smart_weight_profiles')->where('is_public', true)->get();
        if ($profiles->isEmpty()) {
            return; // No profiles to evaluate
        }

        // Get all criteria
        $criteriaList = DB::table('smart_criteria')->get();

        $season = DB::table('player_competition_metrics')->max('season');
        if ($season === null) {
            return;
        }

        // Helper function: Empirical Bayesian Role-Adjusted Utility calculation
        // Decoupled from other players' daily match results (anti-coupling / no global min-max)
        $calculateBayesianUtility = function ($criteriaName, Player $player, object $competition, int $totalMaps) {
            $role = $player->current_role ?? 'Flex';
            $priors = CompetitionQualityConfig::ROLE_EMPIRICAL_PRIORS[$role]
                ?? CompetitionQualityConfig::ROLE_EMPIRICAL_PRIORS['Flex'];
            $sampleMaps = max(1, $totalMaps > 0 ? $totalMaps : (int) round(((int) $competition->total_matches) * 2.5));
            $b = $sampleMaps / ($sampleMaps + CompetitionQualityConfig::BAYESIAN_KAPPA_MAPS);

            switch ($criteriaName) {
                case 'Average Combat Score (ACS)':
                    $raw = (float) $player->avg_acs;
                    $prior = $priors['acs'];
                    $shrunk = ($b * $raw) + ((1.0 - $b) * $prior['mean']);
                    $z = ($shrunk - $prior['mean']) / $prior['scale'];
                    $utility = 100.0 / (1.0 + exp(-1.7 * $z));

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $utility))];

                case 'KAST %':
                    $raw = (float) $player->avg_kast;
                    $prior = $priors['kast'];
                    $shrunk = ($b * $raw) + ((1.0 - $b) * $prior['mean']);
                    $z = ($shrunk - $prior['mean']) / $prior['scale'];
                    $utility = 100.0 / (1.0 + exp(-1.7 * $z));

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $utility))];

                case 'Kill/Death Ratio (KD)':
                    $raw = (float) $player->avg_kd;
                    $prior = $priors['kd'];
                    $shrunk = ($b * $raw) + ((1.0 - $b) * $prior['mean']);
                    $z = ($shrunk - $prior['mean']) / $prior['scale'];
                    $utility = 100.0 / (1.0 + exp(-1.7 * $z));

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $utility))];

                case 'Average Damage per Round (ADR)':
                    $raw = (float) $player->avg_adr;
                    $prior = $priors['adr'];
                    $shrunk = ($b * $raw) + ((1.0 - $b) * $prior['mean']);
                    $z = ($shrunk - $prior['mean']) / $prior['scale'];
                    $utility = 100.0 / (1.0 + exp(-1.7 * $z));

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $utility))];

                case 'First Death Rate':
                    $raw = (float) $player->avg_fd;
                    $prior = $priors['fd'];
                    $shrunk = ($b * $raw) + ((1.0 - $b) * $prior['mean']);
                    // Cost criteria: lower first death is better
                    $z = ($prior['mean'] - $shrunk) / $prior['scale'];
                    $utility = 100.0 / (1.0 + exp(-1.7 * $z));

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $utility))];

                case 'Consistency Percentile':
                    $raw = (float) $competition->consistency_percentile;

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $raw))];

                case 'Meta Adaptability Index':
                    $raw = $player->meta_adaptability_index !== null ? (float) $player->meta_adaptability_index : 70.0;

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $raw))];

                case 'CQI / Competition Exposure':
                    $raw = (float) $competition->cqi_percentile;

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $raw))];

                case 'Proven Consistency':
                    $raw = (float) $competition->proven_consistency;

                    return ['raw' => $raw, 'utility' => max(0.0, min(100.0, $raw))];

                default:
                    return null;
            }
        };

        // Pre-fetch weights for all criteria in all profiles
        $profileWeights = [];
        $weightsData = DB::table('smart_weight_values')->get();
        foreach ($weightsData as $w) {
            $profileWeights[$w->profile_id][$w->criteria_id] = (float) $w->computed_weight;
        }

        $playerIds = collect($this->players)
            ->map(fn ($player) => is_object($player) ? ($player->id ?? null) : $player)
            ->filter()
            ->unique()
            ->values();

        $players = Player::whereIn('id', $playerIds)->get();
        $competitionMetrics = DB::table('player_competition_metrics')
            ->where('season', $season)
            ->whereIn('player_id', $playerIds)
            ->get()
            ->keyBy('player_id');

        $playerMapCounts = DB::table('player_match_agents as pma')
            ->join('matches as m', 'm.id', '=', 'pma.match_id')
            ->join('events as e', 'e.id', '=', 'm.event_id')
            ->whereIn('pma.player_id', $playerIds)
            ->whereYear('m.match_date', $season)
            ->where(function ($q) {
                $q->whereNull('e.competition_level')
                    ->orWhere('e.competition_level', '!=', 'challengers');
            })
            ->whereRaw('LOWER(e.name) NOT LIKE ?', ['%challengers%'])
            ->select('pma.player_id', DB::raw('COUNT(DISTINCT pma.map_id) as total_maps'))
            ->groupBy('pma.player_id')
            ->pluck('total_maps', 'player_id');

        // Career-mode values are cache rows. Replace the requested players in
        // bulk so verified and provisional results always use current metrics.
        DB::table('player_criteria_scores')
            ->whereIn('player_id', $playerIds)
            ->whereNull('patch_id')
            ->delete();

        DB::table('player_smart_results')
            ->whereIn('player_id', $playerIds)
            ->where('mode', 'career')
            ->whereNull('patch_id')
            ->delete();

        $criteriaRows = [];
        $smartResultRows = [];
        $calculatedAt = now();

        // Process each player
        foreach ($players as $player) {
            $competition = $competitionMetrics->get($player->id);
            if ($competition === null || (int) $competition->total_matches < 1) {
                continue;
            }
            $playerMaps = (int) ($playerMapCounts[$player->id] ?? 0);

            $playerCriteriaUtilities = [];

            // Step 2 & 3: Calculate Utility for each criteria
            foreach ($criteriaList as $criteria) {
                $calc = $calculateBayesianUtility($criteria->name, $player, $competition, $playerMaps);
                if (! $calc) {
                    continue;
                }

                $raw = $calc['raw'];
                $utility = $calc['utility'];

                $criteriaRows[] = [
                    'player_id' => $player->id,
                    'criteria_id' => $criteria->id,
                    'patch_id' => null,
                    'raw_value' => $raw,
                    'global_normalized_utility' => $utility,
                    'sample_size' => $playerMaps > 0 ? $playerMaps : (int) $competition->total_matches,
                    'method_version' => CompetitionQualityConfig::METHOD_VERSION,
                    'calculated_at' => $calculatedAt,
                ];

                $playerCriteriaUtilities[$criteria->id] = $utility;
            }

            // Step 4: Calculate final score for each profile
            foreach ($profiles as $profile) {
                $finalScore = 0;
                foreach ($criteriaList as $criteria) {
                    $weight = $profileWeights[$profile->id][$criteria->id] ?? 0;
                    $utility = $playerCriteriaUtilities[$criteria->id] ?? 0;
                    $finalScore += ($utility * $weight);
                }

                $smartResultRows[] = [
                    'player_id' => $player->id,
                    'profile_id' => $profile->id,
                    'mode' => 'career',
                    'patch_id' => null,
                    'final_score' => $finalScore,
                    'calculated_at' => $calculatedAt,
                    'rank' => null,
                    'is_provisional' => (float) $competition->confidence < 1.0,
                    'smart_confidence' => (float) $competition->confidence,
                    'method_version' => CompetitionQualityConfig::METHOD_VERSION,
                ];
            }

            // Dispatch ScrapePlayerProfileJob for players missing a photo
            if ($this->refreshPlayerProfiles && ! $player->photo_url) {
                ScrapePlayerProfileJob::dispatch($player)->onQueue('scrape-low');
            }
        }

        foreach (array_chunk($criteriaRows, 500) as $chunk) {
            DB::table('player_criteria_scores')->insert($chunk);
        }

        foreach (array_chunk($smartResultRows, 500) as $chunk) {
            DB::table('player_smart_results')->insert($chunk);
        }

        // Step 5: Official ranks only include statistically verified players.
        DB::table('player_smart_results')
            ->where('is_provisional', true)
            ->update(['rank' => null]);

        DB::statement('
            WITH RankedResults AS (
                SELECT id, RANK() OVER (PARTITION BY profile_id, mode, patch_id ORDER BY final_score DESC) as new_rank
                FROM player_smart_results
                WHERE is_provisional = FALSE
            )
            UPDATE player_smart_results
            SET rank = RankedResults.new_rank
            FROM RankedResults
            WHERE player_smart_results.id = RankedResults.id;
        ');

        // Step 6: Capture daily snapshot for Growth Chart
        $today = now()->format('Y-m-d');
        $provisionalPlayerIds = collect($smartResultRows)
            ->where('is_provisional', true)
            ->pluck('player_id')
            ->unique();

        if ($provisionalPlayerIds->isNotEmpty()) {
            DB::table('player_smart_rank_history')
                ->where('snapshot_date', $today)
                ->whereIn('player_id', $provisionalPlayerIds)
                ->delete();
        }

        DB::statement("
            INSERT INTO player_smart_rank_history (player_id, profile_id, mode, patch_id, final_score, rank, snapshot_date, created_at, updated_at)
            SELECT player_id, profile_id, mode, patch_id, final_score, rank, '{$today}', NOW(), NOW()
            FROM player_smart_results
            WHERE is_provisional = FALSE AND rank IS NOT NULL
            ON CONFLICT (player_id, profile_id, mode, snapshot_date)
            DO UPDATE SET final_score = EXCLUDED.final_score, rank = EXCLUDED.rank, updated_at = NOW();
        ");

        $cacheVersion = 'smart-'.str_replace('.', '-', (string) microtime(true));
        Cache::put('api_admin_cache_version', $cacheVersion);
        Cache::put('api_smart_calc_version', $cacheVersion);
        Cache::forget('api_dashboard');
        Cache::forget('api_smart_bounds');
        Cache::forget('api_leaderboard_top');
        Cache::forget('api_smart_criteria');

        foreach ($profiles->pluck('user_id')->filter()->unique() as $profileUserId) {
            Cache::forget('api_smart_profiles_'.$profileUserId);
        }

        foreach ($playerIds as $playerId) {
            Cache::forget('api_player_profile_'.$playerId);
        }
    }
}
