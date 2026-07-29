<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\MatchScrapeQueue;
use App\Models\Team;
use App\Models\MatchData;
use Carbon\Carbon;

class SyncMatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $queueItem;

    public function __construct(MatchScrapeQueue $queueItem)
    {
        $this->queueItem = $queueItem;
    }

    public function handle(): void
    {
        if ($this->queueItem->status === "completed") {
            return;
        }

        $this->queueItem->update(["status" => "processing", "attempts" => $this->queueItem->attempts + 1]);

        $headers = [
            "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ];

        try {
            $response = Http::timeout(30)->withoutVerifying()->withHeaders($headers)->get($this->queueItem->url);
            
            if (!$response->successful()) {
                throw new \Exception("HTTP Request failed with status " . $response->status());
            }
            
            $html = $response->body();
            $crawler = new Crawler($html);
            
            // Extract Teams
            $teams = [];
            $crawler->filter(".match-header-link")->each(function (Crawler $node) use (&$teams) {
                $href = $node->attr("href");
                if ($href) {
                    $parts = explode("/", $href);
                    $teamId = $parts[2] ?? null;
                    $nameNodes = $node->filter(".match-header-link-name .wf-title-med");
                    $name = $nameNodes->count() > 0 ? trim($nameNodes->text("")) : "Unknown Team";
                    if ($teamId) {
                        $teams[] = ["id" => $teamId, "name" => $name];
                    }
                }
            });

            if (count($teams) >= 2) {
                $teamA = Team::firstOrCreate(["vlr_team_id" => $teams[0]["id"]], ["name" => $teams[0]["name"] ?: "Unknown Team A"]);
                $teamB = Team::firstOrCreate(["vlr_team_id" => $teams[1]["id"]], ["name" => $teams[1]["name"] ?: "Unknown Team B"]);

                MatchData::updateOrCreate(
                    ["vlr_match_id" => $this->queueItem->vlr_match_id],
                    [
                        "event_id" => $this->queueItem->event_id,
                        "team_a_id" => $teamA->id,
                        "team_b_id" => $teamB->id,
                        "winner_team_id" => $teamA->id,
                        "match_date" => Carbon::now(),
                        "raw_stage_label" => "Playoffs",
                        "format" => "Bo3"
                    ]
                );

                // Save HTML locally for ETL parsing
                $fileName = "scrapes/match_" . $this->queueItem->vlr_match_id . ".html";
                Storage::put($fileName, $html);

                // Dispatch ParseMatchJob
                ParseMatchJob::dispatch($this->queueItem, $fileName);
            } else {
                $this->queueItem->update(["status" => "failed", "error_message" => "Could not extract 2 teams"]);
            }
            
        } catch (\Exception $e) {
            $this->queueItem->update(["status" => "failed", "error_message" => $e->getMessage()]);
            throw $e;
        }
    }
}

