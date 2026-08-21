<?php

namespace App\Jobs;

use App\Models\Player;
use App\Services\ConsistencyIndexCalculator;
use App\Services\ProvisionalConsistencyEstimator;
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

    public function handle(ProvisionalConsistencyEstimator $consistencyEstimator): void
    {
        // Get global active weight profiles
        $profiles = DB::table('smart_weight_profiles')->where('is_public', true)->get();
        if ($profiles->isEmpty()) {
            return; // No profiles to evaluate
        }

        // Get all criteria
        $criteriaList = DB::table('smart_criteria')->get();

        // Step 1: Pre-calculate global Min & Max for normalization
        // Only statistically eligible players define the normalization cohort.
        $statsQuery = DB::table('players')
            ->where('consistency_sample_size', '>=', ConsistencyIndexCalculator::MINIMUM_SAMPLE_SIZE)
            ->where('consistency_event_count', '>=', ConsistencyIndexCalculator::MINIMUM_EVENT_COUNT)
            ->whereNotNull('consistency_index');
        $verifiedCiValues = (clone $statsQuery)->pluck('consistency_index');
        $cohortMedianCi = $verifiedCiValues->isEmpty()
            ? 50.0
            : (float) $verifiedCiValues->median();

        $globalStats = (clone $statsQuery)->selectRaw('
            MIN(avg_acs) as min_acs, MAX(avg_acs) as max_acs,
            MIN(avg_kast) as min_kast, MAX(avg_kast) as max_kast,
            MIN(avg_kd) as min_kd, MAX(avg_kd) as max_kd,
            MIN(avg_adr) as min_adr, MAX(avg_adr) as max_adr,
            MIN(avg_fd) as min_fd, MAX(avg_fd) as max_fd,
            MIN(consistency_index) as min_ci, MAX(consistency_index) as max_ci,
            MIN(meta_adaptability_index) as min_mai, MAX(meta_adaptability_index) as max_mai,
            MIN(competition_quality_index) as min_cqi, MAX(competition_quality_index) as max_cqi
        ')->first();

        // Helper function to map criteria name to db column
        $getRawValueAndBounds = function ($criteriaName, Player $player, float $consistencyValue) use ($globalStats) {
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
                case 'Consistency Index':
                    return [
                        'raw' => $consistencyValue,
                        'min' => 0.0,
                        'max' => 100.0,
                        'direct_utility' => true,
                    ];
                case 'Meta Adaptability Index':
                    $raw = $player->meta_adaptability_index !== null ? (float) $player->meta_adaptability_index : 0;

                    return ['raw' => $raw, 'min' => (float) $globalStats->min_mai, 'max' => (float) $globalStats->max_mai];
                case 'Competition Quality Index':
                    $raw = $player->competition_quality_index !== null ? (float) $player->competition_quality_index : 0;

                    return ['raw' => $raw, 'min' => (float) $globalStats->min_cqi, 'max' => (float) $globalStats->max_cqi];
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
            ->pluck('id')
            ->filter()
            ->unique()
            ->values();

        $players = Player::whereIn('id', $playerIds)->get();

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
            // A player still needs at least one valid completed match. CI itself
            // can remain unofficial while SMART uses a confidence-shrunk value.
            if ($player->consistency_sample_size < 1) {
                continue;
            }

            $consistencyForSmart = $consistencyEstimator->estimate(
                $player->consistency_index,
                $player->consistency_provisional_index,
                $player->consistency_sample_size,
                $player->consistency_event_count,
                $cohortMedianCi,
            );

            $playerCriteriaUtilities = [];

            // Step 2 & 3: Calculate Utility for each criteria
            foreach ($criteriaList as $criteria) {
                $bounds = $getRawValueAndBounds($criteria->name, $player, $consistencyForSmart['value']);
                if (! $bounds) {
                    continue;
                }

                $raw = $bounds['raw'];
                $min = $bounds['min'];
                $max = $bounds['max'];

                $utility = 0;
                if ($bounds['direct_utility'] ?? false) {
                    // CI already has a stable and meaningful absolute 0-100 scale.
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
                    'sample_size' => $player->consistency_sample_size,
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
                    'is_provisional' => $consistencyForSmart['is_provisional'],
                    'smart_confidence' => $consistencyForSmart['confidence'],
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

        foreach ($playerIds as $playerId) {
            Cache::forget('api_player_profile_'.$playerId);
        }
    }
}
