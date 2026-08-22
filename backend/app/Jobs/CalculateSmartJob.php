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

        // Only verified players define min/max bounds for raw-stat criteria.
        // CQI v2 criteria already arrive as stable 0-100 utilities.
        $statsQuery = DB::table('players as p')
            ->join('player_competition_metrics as pcm', 'pcm.player_id', '=', 'p.id')
            ->where('pcm.season', $season)
            ->where('pcm.confidence', '>=', 1);

        $globalStats = (clone $statsQuery)->selectRaw('
            MIN(p.avg_acs) as min_acs, MAX(p.avg_acs) as max_acs,
            MIN(p.avg_kast) as min_kast, MAX(p.avg_kast) as max_kast,
            MIN(p.avg_kd) as min_kd, MAX(p.avg_kd) as max_kd,
            MIN(p.avg_adr) as min_adr, MAX(p.avg_adr) as max_adr,
            MIN(p.avg_fd) as min_fd, MAX(p.avg_fd) as max_fd,
            MIN(p.meta_adaptability_index) as min_mai, MAX(p.meta_adaptability_index) as max_mai
        ')->first();

        // Helper function to map criteria name to db column
        $getRawValueAndBounds = function ($criteriaName, Player $player, object $competition) use ($globalStats) {
            switch ($criteriaName) {
                case 'Average Combat Score (ACS)':
                    return ['raw' => (float) $player->avg_acs, 'min' => (float) $globalStats->min_acs, 'max' => (float) $globalStats->max_acs];
                case 'KAST %':
                    return ['raw' => (float) $player->avg_kast, 'min' => (float) $globalStats->min_kast, 'max' => (float) $globalStats->max_kast];
                case 'Kill/Death Ratio (KD)':
                    return ['raw' => (float) $player->avg_kd, 'min' => (float) $globalStats->min_kd, 'max' => (float) $globalStats->max_kd];
                case 'Average Damage per Round (ADR)':
                    return ['raw' => (float) $player->avg_adr, 'min' => (float) $globalStats->min_adr, 'max' => (float) $globalStats->max_adr];
                case 'First Death Rate':
                    return ['raw' => (float) $player->avg_fd, 'min' => (float) $globalStats->min_fd, 'max' => (float) $globalStats->max_fd];
                case 'Consistency Percentile':
                    return [
                        'raw' => (float) $competition->consistency_percentile,
                        'min' => 0.0,
                        'max' => 100.0,
                        'direct_utility' => true,
                    ];
                case 'Meta Adaptability Index':
                    $raw = $player->meta_adaptability_index !== null ? (float) $player->meta_adaptability_index : 0;

                    return ['raw' => $raw, 'min' => (float) $globalStats->min_mai, 'max' => (float) $globalStats->max_mai];
                case 'CQI / Competition Exposure':
                    return [
                        'raw' => (float) $competition->cqi_percentile,
                        'min' => 0.0,
                        'max' => 100.0,
                        'direct_utility' => true,
                    ];
                case 'Proven Consistency':
                    return [
                        'raw' => (float) $competition->proven_consistency,
                        'min' => 0.0,
                        'max' => 100.0,
                        'direct_utility' => true,
                    ];
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

            $playerCriteriaUtilities = [];

            // Step 2 & 3: Calculate Utility for each criteria
            foreach ($criteriaList as $criteria) {
                $bounds = $getRawValueAndBounds($criteria->name, $player, $competition);
                if (! $bounds) {
                    continue;
                }

                $raw = $bounds['raw'];
                $min = $bounds['min'];
                $max = $bounds['max'];

                $utility = 0;
                if ($bounds['direct_utility'] ?? false) {
                    // CQI v2 percentile criteria already have a stable 0-100 scale.
                    $utility = $raw;
                } elseif ($max > $min) {
                    if ($criteria->type === 'benefit') {
                        $utility = (($raw - $min) / ($max - $min)) * 100;
                    } else { // cost
                        $utility = (($max - $raw) / ($max - $min)) * 100;
                    }
                } elseif ($max == $min && $max > 0) {
                    $utility = 100; // If everyone has the same score
                }

                // Ensure utility is bounded 0-100 (in case raw is out of bounds due to edge cases)
                $utility = max(0, min(100, $utility));

                $criteriaRows[] = [
                    'player_id' => $player->id,
                    'criteria_id' => $criteria->id,
                    'patch_id' => null,
                    'raw_value' => $raw,
                    'global_normalized_utility' => $utility,
                    'sample_size' => $competition->total_matches,
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
