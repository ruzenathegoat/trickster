<?php

namespace App\Console\Commands;

use App\Models\Map;
use App\Models\MatchData;
use App\Models\MatchScrapeQueue;
use App\Models\Player;
use App\Models\PlayerMapStat;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

class BackfillClutchStats extends Command
{
    protected $signature = 'trickster:backfill-clutch
                            {--limit= : Maximum number of matches to process}
                            {--match= : Specific VLR match ID to process}
                            {--force : Process matches even if clutch stats are already present}
                            {--no-recalc : Skip recalculating metrics and SMART scores afterwards}';

    protected $description = 'Backfill clutch statistics (1v1 - 1v5) from VLR.gg performance tab for 2026 matches';

    public function handle(): int
    {
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $specificMatch = $this->option('match');
        $force = (bool) $this->option('force');
        $noRecalc = (bool) $this->option('no-recalc');

        $query = MatchData::whereNotNull('vlr_match_id')
            ->whereNotNull('winner_team_id')
            ->orderBy('match_date', 'asc');

        if ($specificMatch) {
            $query->where('vlr_match_id', $specificMatch);
        } else {
            $query->whereYear('match_date', 2026);
        }

        $matches = $query->get();
        if ($matches->isEmpty()) {
            $this->warn('No eligible completed matches found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$matches->count()} matches for season 2026.");

        $processedCount = 0;
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ];

        $affectedPlayerIds = [];
        $bar = $this->output->createProgressBar($limit ? min($limit, $matches->count()) : $matches->count());
        $bar->start();

        foreach ($matches as $match) {
            if ($limit !== null && $processedCount >= $limit) {
                break;
            }

            // Find "All Maps" map entry
            $allMaps = Map::where('match_id', $match->id)
                ->where('map_name', 'All Maps')
                ->first();

            if (! $allMaps) {
                $bar->advance();
                continue;
            }

            // Check if clutch stats already exist unless --force
            if (! $force) {
                $alreadyParsed = PlayerMapStat::where('match_id', $match->id)
                    ->where('map_id', $allMaps->id)
                    ->where('clutches_won', '>', 0)
                    ->exists();

                if ($alreadyParsed) {
                    $bar->advance();
                    continue;
                }
            }

            // Find Queue Item for URL
            $queueItem = MatchScrapeQueue::where('vlr_match_id', $match->vlr_match_id)->first();
            $baseUrl = $queueItem ? $queueItem->url : "https://www.vlr.gg/{$match->vlr_match_id}";
            $perfUrl = rtrim($baseUrl, '/') . '/?game=all&tab=performance';

            try {
                // Sleep 1.5 seconds between HTTP requests to respect rate limits
                usleep(1500000);

                $response = Http::timeout(30)->withoutVerifying()->withHeaders($headers)->get($perfUrl);
                if (! $response->successful()) {
                    $this->warn("HTTP error {$response->status()} for match {$match->vlr_match_id}");
                    $bar->advance();
                    continue;
                }

                $crawler = new Crawler($response->body());
                $table = $crawler->filter('.vm-stats-game[data-game-id="all"] table.mod-adv-stats');

                if ($table->count() === 0) {
                    // Try fallback without data-game-id attribute
                    $table = $crawler->filter('table.mod-adv-stats')->first();
                }

                if ($table->count() === 0) {
                    $bar->advance();
                    continue;
                }

                // Get all players for this match in All Maps
                $existingMapStats = PlayerMapStat::where('match_id', $match->id)
                    ->where('map_id', $allMaps->id)
                    ->with('player')
                    ->get()
                    ->keyBy(fn ($stat) => strtolower(trim((string) $stat->player?->ign)));

                $table->filter('tr')->each(function (Crawler $tr) use ($existingMapStats, &$affectedPlayerIds) {
                    if ($tr->filter('th')->count() > 0) {
                        return;
                    }

                    $teamDiv = $tr->filter('.team');
                    if ($teamDiv->count() === 0) {
                        return;
                    }

                    $tag = $tr->filter('.team-tag')->count() > 0 ? trim($tr->filter('.team-tag')->text()) : '';
                    $rawText = trim($teamDiv->text());
                    $ign = trim(str_replace($tag, '', $rawText));
                    $lowerIgn = strtolower($ign);

                    $mapStat = $existingMapStats->get($lowerIgn);
                    if (! $mapStat) {
                        // Attempt partial match if exact match fails
                        foreach ($existingMapStats as $key => $val) {
                            if (str_contains($key, $lowerIgn) || str_contains($lowerIgn, (string) $key)) {
                                $mapStat = $val;
                                break;
                            }
                        }
                    }

                    if (! $mapStat) {
                        return;
                    }

                    $cells = $tr->filter('td');
                    $getVal = static function (Crawler $cell): int {
                        $sq = $cell->filter('.stats-sq');
                        if ($sq->count() === 0) {
                            return 0;
                        }
                        $text = trim($sq->text(''));
                        return is_numeric($text) ? (int) $text : 0;
                    };

                    // Adv stats columns: 0=Player, 1=Agent, 2=2K, 3=3K, 4=4K, 5=5K, 6=1v1, 7=1v2, 8=1v3, 9=1v4, 10=1v5
                    $c1 = $getVal($cells->eq(6));
                    $c2 = $getVal($cells->eq(7));
                    $c3 = $getVal($cells->eq(8));
                    $c4 = $getVal($cells->eq(9));
                    $c5 = $getVal($cells->eq(10));

                    $won = $c1 + $c2 + $c3 + $c4 + $c5;
                    $points = (1.0 * $c1) + (2.0 * $c2) + (3.5 * $c3) + (5.0 * $c4) + (7.0 * $c5);

                    $mapStat->update([
                        'clutch_1v1' => $c1,
                        'clutch_1v2' => $c2,
                        'clutch_1v3' => $c3,
                        'clutch_1v4' => $c4,
                        'clutch_1v5' => $c5,
                        'clutches_won' => $won,
                        'clutch_points' => $points,
                    ]);

                    $affectedPlayerIds[] = $mapStat->player_id;
                });

                $processedCount++;
            } catch (\Exception $e) {
                // Log and continue gracefully
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Successfully processed clutch statistics for {$processedCount} matches.");

        if (! $noRecalc && ! empty($affectedPlayerIds)) {
            $uniquePlayerIds = array_values(array_unique($affectedPlayerIds));
            $this->info("Recalculating career metrics & SMART scores for " . count($uniquePlayerIds) . " players...");

            $players = Player::whereIn('id', $uniquePlayerIds)->get();
            $ciService = app(\App\Services\ConsistencyIndexService::class);
            $roleProfileService = app(\App\Services\PlayerRoleProfileService::class);

            foreach ($players->chunk(25) as $chunk) {
                $job = new \App\Jobs\CalculateMetricJob('backfill', $chunk->all(), false);
                $job->handle($ciService, $roleProfileService);
            }

            $season = (int) now()->format('Y');

            // Dispatch downstream recalculation via artisan command
            $this->call('metrics:recalculate-competition-quality', [
                'season' => $season,
            ]);

            $this->info('Metrics recalculation completed.');
        }

        return Command::SUCCESS;
    }
}
