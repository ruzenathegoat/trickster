<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Event;
use App\Models\MatchScrapeQueue;

class SyncEventJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $event;
    public $eventLink;

    public function __construct(Event $event, string $eventLink)
    {
        $this->event = $event;
        $this->eventLink = $eventLink;
    }

    public function handle(): void
    {
        $baseUrl = "https://www.vlr.gg";
        $headers = [
            "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ];

        $url = str_replace("/event/", "/event/matches/", $this->eventLink);
        
        try {
            $response = Http::timeout(30)->withoutVerifying()->withHeaders($headers)->get($baseUrl . $url);
            $crawler = new Crawler($response->body());

            $crawler->filter(".wf-card a.match-item")->each(function (Crawler $node) {
                try {
                    $link = $node->attr("href");
                    $matchId = explode("/", $link)[1] ?? null;
                    
                    if ($matchId) {
                        $queueItem = MatchScrapeQueue::firstOrCreate(
                            ["vlr_match_id" => $matchId],
                            [
                                "event_id" => $this->event->id,
                                "url" => "https://www.vlr.gg" . $link,
                                "status" => "pending"
                            ]
                        );
                        
                        if ($queueItem->status === "pending") {
                            $eventName = strtolower($this->event->name);
                            $queue = "scrape-low";
                            
                            if (str_contains($eventName, "champions") || str_contains($eventName, "masters")) {
                                $queue = "scrape-high";
                            } elseif (str_contains($eventName, "kickoff")) {
                                $queue = "scrape-low";
                            } elseif (str_contains($eventName, "stage") || str_contains($eventName, "split")) {
                                $queue = "scrape-default";
                            }

                            SyncMatchJob::dispatch($queueItem)->onQueue($queue);
                        }
                    }
                } catch (\Exception $e) {
                    // skip malformed link
                }
            });
        } catch (\Exception $e) {
            \Log::error("Failed to sync event matches: " . $e->getMessage());
            throw $e;
        }
    }
}

