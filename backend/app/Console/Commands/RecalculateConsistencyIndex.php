<?php

namespace App\Console\Commands;

use App\Jobs\CalculateMetricJob;
use App\Jobs\CalculateSmartJob;
use App\Jobs\SyncMatchJob;
use App\Models\MatchScrapeQueue;
use App\Models\Player;
use App\Services\ConsistencyIndexCalculator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class RecalculateConsistencyIndex extends Command
{
    protected $signature = 'trickster:recalculate-ci
        {--repair-invalid : Convert non-positive ACS observations to null and requeue their matches}
        {--dispatch-rescrapes : Dispatch repaired matches to the scrape-default queue}
        {--smart-only : Regenerate SMART cache rows and ranks without recalculating player aggregates}';

    protected $description = 'Recalculate player aggregates, CI eligibility, SMART utilities, and rankings';

    public function handle(): int
    {
        if ($this->option('dispatch-rescrapes') && ! $this->option('repair-invalid')) {
            $this->error('--dispatch-rescrapes requires --repair-invalid.');

            return self::INVALID;
        }

        $invalidMatches = collect();

        if ($this->option('repair-invalid')) {
            $invalidMatches = DB::table('player_map_stats as pms')
                ->join('matches as matches', 'matches.id', '=', 'pms.match_id')
                ->where(function ($query) {
                    $query->whereNull('pms.acs')->orWhere('pms.acs', '<=', 0);
                })
                ->whereNotNull('matches.winner_team_id')
                ->whereNotNull('matches.vlr_match_id')
                ->select('matches.id', 'matches.vlr_match_id')
                ->distinct()
                ->get();

            $invalidRows = DB::table('player_map_stats')
                ->where('acs', '<=', 0)
                ->update(['acs' => null]);

            $this->info("Invalid ACS rows quarantined: {$invalidRows}");
            $this->info("Source matches marked for repair: {$invalidMatches->count()}");

            if ($invalidMatches->isNotEmpty()) {
                MatchScrapeQueue::whereIn('vlr_match_id', $invalidMatches->pluck('vlr_match_id'))
                    ->update([
                        'status' => 'pending',
                        'error_message' => 'Pending: CI data-quality repair requested',
                    ]);
            }

            if ($this->option('dispatch-rescrapes')) {
                MatchScrapeQueue::whereIn('vlr_match_id', $invalidMatches->pluck('vlr_match_id'))
                    ->get()
                    ->each(fn (MatchScrapeQueue $queueItem) => SyncMatchJob::dispatch($queueItem)->onQueue('scrape-default'));

                $this->info("Rescrape jobs dispatched: {$invalidMatches->count()}");
            }
        }

        $players = Player::orderBy('id')->get();

        if (! $this->option('smart-only')) {
            $this->info("Recalculating metrics for {$players->count()} players...");

            $bar = $this->output->createProgressBar($players->count());
            $bar->start();

            $players->chunk(50)->each(function ($chunk) use ($bar) {
                $job = new CalculateMetricJob('full-ci-recalculation', $chunk->all(), false);
                app()->call([$job, 'handle']);
                $bar->advance($chunk->count());
            });

            $bar->finish();
            $this->newLine(2);
        }

        $players = Player::orderBy('id')->get();
        $smartJob = new CalculateSmartJob('full-ci-recalculation', $players->all(), false);
        app()->call([$smartJob, 'handle']);

        $cacheVersion = 'ci-v2-'.now()->format('YmdHis');
        Cache::put('api_admin_cache_version', $cacheVersion);
        Cache::put('api_smart_calc_version', $cacheVersion);
        Cache::forget('api_dashboard');
        Cache::forget('api_smart_bounds');

        foreach ($players as $player) {
            Cache::forget('api_player_profile_'.$player->id);
        }

        $eligible = $players
            ->filter(fn (Player $player) => $player->consistency_index !== null
                && $player->consistency_sample_size >= ConsistencyIndexCalculator::MINIMUM_SAMPLE_SIZE
                && $player->consistency_event_count >= ConsistencyIndexCalculator::MINIMUM_EVENT_COUNT);
        $provisional = $players
            ->filter(fn (Player $player) => $player->consistency_sample_size > 0)
            ->diff($eligible);

        $ciValues = $eligible->pluck('consistency_index')->sort()->values();
        $median = $ciValues->isEmpty() ? null : $ciValues->median();

        $this->table(
            ['Metric', 'Result'],
            [
                ['CI method', ConsistencyIndexCalculator::METHOD],
                ['Eligible players', $eligible->count()],
                ['Provisional SMART players', $provisional->count()],
                ['Players without valid match data', $players->count() - $eligible->count() - $provisional->count()],
                ['Minimum CI', $ciValues->isEmpty() ? 'N/A' : number_format((float) $ciValues->min(), 2)],
                ['Median CI', $median === null ? 'N/A' : number_format((float) $median, 2)],
                ['Maximum CI', $ciValues->isEmpty() ? 'N/A' : number_format((float) $ciValues->max(), 2)],
                ['Invalid matches queued', $invalidMatches->count()],
            ],
        );

        return self::SUCCESS;
    }
}
