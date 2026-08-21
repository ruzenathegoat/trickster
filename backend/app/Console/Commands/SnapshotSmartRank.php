<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SnapshotSmartRank extends Command
{
    protected $signature = 'smart:snapshot';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Take a daily snapshot of all player SMART ranks';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting SMART rank snapshot...');

        // Step 1: Re-calculate ranks for all players in all profiles
        \Illuminate\Support\Facades\DB::table('player_smart_results')
            ->where('is_provisional', true)
            ->update(['rank' => null]);

        \Illuminate\Support\Facades\DB::statement('
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

        // Step 2: Capture daily snapshot for Growth Chart
        $today = now()->format('Y-m-d');
        \Illuminate\Support\Facades\DB::statement("
            INSERT INTO player_smart_rank_history (player_id, profile_id, mode, patch_id, final_score, rank, snapshot_date, created_at, updated_at)
            SELECT player_id, profile_id, mode, patch_id, final_score, rank, '{$today}', NOW(), NOW()
            FROM player_smart_results
            WHERE is_provisional = FALSE AND rank IS NOT NULL
            ON CONFLICT (player_id, profile_id, mode, snapshot_date)
            DO UPDATE SET final_score = EXCLUDED.final_score, rank = EXCLUDED.rank, updated_at = NOW();
        ");

        $this->info("Snapshot successfully captured for {$today}!");
    }
}
