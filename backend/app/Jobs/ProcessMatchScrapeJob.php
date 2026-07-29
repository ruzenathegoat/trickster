<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\MatchScrapeQueue;
use App\Models\Team;
use App\Models\MatchData;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use Carbon\Carbon;

class ProcessMatchScrapeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $queueItem;

    /**
     * Create a new job instance.
     */
    public function __construct(MatchScrapeQueue $queueItem)
    {
        $this->queueItem = $queueItem;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Don't process if it's already completed
        if ($this->queueItem->status === 'completed') {
            return;
        }

        $this->queueItem->update(['status' => 'processing', 'attempts' => $this->queueItem->attempts + 1]);

        $headers = [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language' => 'en-US,en;q=0.9',
        ];

        try {
            $response = Http::timeout(30)->withoutVerifying()->withHeaders($headers)->get($this->queueItem->url);
            
            if (!$response->successful()) {
                throw new \Exception("HTTP Request failed with status " . $response->status());
            }
            
            $crawler = new Crawler($response->body());
            
            // Extract Teams
            $teams = [];
            $crawler->filter(".match-header-link")->each(function (Crawler $node) use (&$teams) {
                $href = $node->attr("href");
                if ($href) {
                    $parts = explode("/", $href);
                    $teamId = $parts[2] ?? null;
                    $nameNodes = $node->filter(".match-header-link-name .wf-title-med");
                    $name = $nameNodes->count() > 0 ? trim($nameNodes->text("")) : 'Unknown Team';
                    if ($teamId) {
                        $teams[] = ["id" => $teamId, "name" => $name];
                    }
                }
            });

            if (count($teams) >= 2) {
                $teamA = Team::firstOrCreate(['vlr_team_id' => $teams[0]['id']], ['name' => $teams[0]['name'] ?: 'Unknown Team A']);
                $teamB = Team::firstOrCreate(['vlr_team_id' => $teams[1]['id']], ['name' => $teams[1]['name'] ?: 'Unknown Team B']);

                MatchData::updateOrCreate(
                    ['vlr_match_id' => $this->queueItem->vlr_match_id],
                    [
                        'event_id' => $this->queueItem->event_id,
                        'team_a_id' => $teamA->id,
                        'team_b_id' => $teamB->id,
                        'winner_team_id' => $teamA->id, // Simplified for now
                        'match_date' => Carbon::now(),
                        'raw_stage_label' => 'Playoffs',
                        'format' => 'Bo3'
                    ]
                );

                // Extract Players
                $crawler->filter(".mod-player")->each(function (Crawler $node) {
                    $a = $node->filter("a");
                    if ($a->count() > 0) {
                        $href = $a->attr("href");
                        $parts = explode("/", $href);
                        $id = $parts[2] ?? null;
                        $name = trim($a->filter(".text-of")->text(""));
                        
                        if ($id && $name) {
                            $player = \App\Models\Player::updateOrCreate(
                                ['vlr_player_id' => $id],
                                ['ign' => $name, 'name' => $name]
                            );
                            
                            // If player photo is missing, dispatch job to scrape it
                            if (!$player->photo_url) {
                                \App\Jobs\ScrapePlayerProfileJob::dispatch($player);
                            }
                        }
                    }
                });
            }

            $this->queueItem->update(['status' => 'completed']);
            
            // Sleep slightly to respect VLR rate limits
            sleep(2);
        } catch (\Exception $e) {
            $this->queueItem->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            // Re-throw so Laravel's queue worker knows it failed
            throw $e;
        }
    }
}
