<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Player;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CalculateSmartJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $matchId;
    public $players;

    public function __construct(string $matchId, array $players)
    {
        $this->matchId = $matchId;
        $this->players = $players;
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

        // Step 1: Pre-calculate global Min & Max for normalization
        // We only consider players with at least 20 matches for a fair comparison
        $globalMinMax = [];
        $validPlayersCount = DB::table('players')->where('total_matches', '>=', 20)->count();

        // If not enough players, fallback to all players with matches
        $minMatches = $validPlayersCount > 10 ? 20 : 1; 

        $statsQuery = DB::table('players')->where('total_matches', '>=', $minMatches);
        $globalStats = $statsQuery->selectRaw('
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
        $getRawValueAndBounds = function($criteriaName, $playerModel) use ($globalStats) {
            $player = Player::find($playerModel->id);
            if (!$player) return null;

            switch ($criteriaName) {
                case 'Average Combat Score (ACS)':
                    return ['raw' => (float)$player->avg_acs, 'min' => (float)$globalStats->min_acs, 'max' => (float)$globalStats->max_acs];
                case 'KAST %':
                    return ['raw' => (float)$player->avg_kast, 'min' => (float)$globalStats->min_kast, 'max' => (float)$globalStats->max_kast];
                case 'Kill/Death Ratio (KD)':
                    return ['raw' => (float)$player->avg_kd, 'min' => (float)$globalStats->min_kd, 'max' => (float)$globalStats->max_kd];
                case 'Average Damage per Round (ADR)':
                    return ['raw' => (float)$player->avg_adr, 'min' => (float)$globalStats->min_adr, 'max' => (float)$globalStats->max_adr];
                case 'First Death Rate':
                    return ['raw' => (float)$player->avg_fd, 'min' => (float)$globalStats->min_fd, 'max' => (float)$globalStats->max_fd];
                case 'Consistency Index':
                    $raw = $player->consistency_index !== null ? (float)$player->consistency_index : 0;
                    return ['raw' => $raw, 'min' => (float)$globalStats->min_ci, 'max' => (float)$globalStats->max_ci];
                case 'Meta Adaptability Index':
                    $raw = $player->meta_adaptability_index !== null ? (float)$player->meta_adaptability_index : 0;
                    return ['raw' => $raw, 'min' => (float)$globalStats->min_mai, 'max' => (float)$globalStats->max_mai];
                case 'Competition Quality Index':
                    $raw = $player->competition_quality_index !== null ? (float)$player->competition_quality_index : 0;
                    return ['raw' => $raw, 'min' => (float)$globalStats->min_cqi, 'max' => (float)$globalStats->max_cqi];
                default:
                    return null;
            }
        };

        // Pre-fetch weights for all criteria in all profiles
        $profileWeights = [];
        $weightsData = DB::table('smart_weight_values')->get();
        foreach ($weightsData as $w) {
            $profileWeights[$w->profile_id][$w->criteria_id] = (float)$w->computed_weight;
        }

        // Process each player
        foreach ($this->players as $playerModel) {
            $player = Player::find($playerModel->id);
            if (!$player) continue;

            $playerCriteriaUtilities = [];

            // Step 2 & 3: Calculate Utility for each criteria
            foreach ($criteriaList as $criteria) {
                $bounds = $getRawValueAndBounds($criteria->name, $player);
                if (!$bounds) continue;

                $raw = $bounds['raw'];
                $min = $bounds['min'];
                $max = $bounds['max'];

                $utility = 0;
                if ($max > $min) {
                    if ($criteria->type === 'benefit') {
                        $utility = (($raw - $min) / ($max - $min)) * 100;
                    } else { // cost
                        $utility = (($max - $raw) / ($max - $min)) * 100;
                    }
                } else if ($max == $min && $max > 0) {
                    $utility = 100; // If everyone has the same score
                }
                
                // Ensure utility is bounded 0-100 (in case raw is out of bounds due to edge cases)
                $utility = max(0, min(100, $utility));

                // Save to player_criteria_scores
                DB::table('player_criteria_scores')->updateOrInsert(
                    [
                        'player_id' => $player->id,
                        'criteria_id' => $criteria->id,
                        'patch_id' => null, // career mode
                    ],
                    [
                        'raw_value' => $raw,
                        'global_normalized_utility' => $utility,
                        'sample_size' => $player->total_matches,
                        'calculated_at' => now()
                    ]
                );

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

                DB::table('player_smart_results')->updateOrInsert(
                    [
                        'player_id' => $player->id,
                        'profile_id' => $profile->id,
                        'mode' => 'career',
                        'patch_id' => null,
                    ],
                    [
                        'final_score' => $finalScore,
                        'calculated_at' => now(),
                        'rank' => null // Rank can be calculated separately in a cron if needed
                    ]
                );
            }

            // Dispatch ScrapePlayerProfileJob for players missing a photo
            if (!$player->photo_url) {
                ScrapePlayerProfileJob::dispatch($player)->onQueue("scrape-low");
            }
        }

        // Step 5: Re-calculate ranks for all players in all profiles
        DB::statement('
            WITH RankedResults AS (
                SELECT id, RANK() OVER (PARTITION BY profile_id, mode, patch_id ORDER BY final_score DESC) as new_rank
                FROM player_smart_results
            )
            UPDATE player_smart_results
            SET rank = RankedResults.new_rank
            FROM RankedResults
            WHERE player_smart_results.id = RankedResults.id;
        ');

        // Step 6: Capture daily snapshot for Growth Chart
        $today = now()->format('Y-m-d');
        DB::statement("
            INSERT INTO player_smart_rank_history (player_id, profile_id, mode, patch_id, final_score, rank, snapshot_date, created_at, updated_at)
            SELECT player_id, profile_id, mode, patch_id, final_score, rank, '{$today}', NOW(), NOW()
            FROM player_smart_results
            ON CONFLICT (player_id, profile_id, mode, snapshot_date)
            DO UPDATE SET final_score = EXCLUDED.final_score, rank = EXCLUDED.rank, updated_at = NOW();
        ");
    }
}
