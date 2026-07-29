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

                // Extract Stage Label
                $stageLabelNodes = $crawler->filter(".match-header-event-series");
                $stageLabel = $stageLabelNodes->count() > 0 ? trim(preg_replace("/\s+/", " ", $stageLabelNodes->text(""))) : null;

                // Extract Winner
                $winnerTeamId = null;
                $spans = $crawler->filter(".match-header-vs-score .sp-hide span");
                if ($spans->count() >= 3) {
                    $teamAClass = $spans->eq(0)->attr("class");
                    $teamBClass = $spans->eq(2)->attr("class");
                    
                    if (strpos($teamAClass, 'winner') !== false) {
                        $winnerTeamId = $teamA->id;
                    } elseif (strpos($teamBClass, 'winner') !== false) {
                        $winnerTeamId = $teamB->id;
                    }
                }

                // Extract Format
                $noteNodes = $crawler->filter(".match-header-vs-note");
                $formatStr = null;
                if ($noteNodes->count() > 1) {
                    $formatStr = trim($noteNodes->eq(1)->text(""));
                } else if ($noteNodes->count() === 1) {
                    $formatStr = trim($noteNodes->eq(0)->text(""));
                }
                
                $format = null;
                if ($formatStr && preg_match('/Bo(\d+)/i', $formatStr, $matches)) {
                    $format = (int) $matches[1];
                }

                // Extract Date
                $dateNode = $crawler->filter(".moment-tz-convert");
                $matchDate = null;
                if ($dateNode->count() > 0 && $dateNode->attr("data-utc-ts")) {
                    $matchDate = Carbon::parse($dateNode->attr("data-utc-ts"));
                }

                $scoreSpans = $crawler->filter(".match-header-vs-score .sp-hide span");
                if ($scoreSpans->count() >= 3) {
                    if (str_contains($scoreSpans->eq(0)->attr("class") ?? "", "winner")) {
                        $winnerTeamId = $teamA->id;
                    } else if (str_contains($scoreSpans->eq(2)->attr("class") ?? "", "winner")) {
                        $winnerTeamId = $teamB->id;
                    }
                }

                MatchData::updateOrCreate(
                    ["vlr_match_id" => $this->queueItem->vlr_match_id],
                    [
                        "event_id" => $this->queueItem->event_id,
                        "team_a_id" => $teamA->id,
                        "team_b_id" => $teamB->id,
                        "winner_team_id" => $winnerTeamId,
                        "match_date" => $matchDate,
                        "raw_stage_label" => $stageLabel,
                        "best_of" => $format
                    ]
                );

                // Save HTML locally for ETL parsing
                $fileName = "scrapes/match_" . $this->queueItem->vlr_match_id . ".html";
                Storage::put($fileName, $html);

                // Dispatch ParseMatchJob on scrape-high so it runs before remaining SyncMatchJobs
                ParseMatchJob::dispatch($this->queueItem, $fileName)->onQueue("scrape-high");
            } else {
                $this->queueItem->update(["status" => "completed", "error_message" => "Skipped: TBD Match (Teams not decided yet)"]);
            }
            
        } catch (\Exception $e) {
            $this->queueItem->update(["status" => "failed", "error_message" => $e->getMessage()]);
            throw $e;
        }
    }
}

