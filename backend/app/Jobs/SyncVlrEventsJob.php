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
use App\Models\ScrapeJobsLog;
use Carbon\Carbon;

use Illuminate\Support\Str;
use App\Models\MatchScrapeQueue;

class SyncVlrEventsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $log = ScrapeJobsLog::create([
            "source" => "/events",
            "status" => "started",
            "started_at" => now(),
            "records_processed" => 0
        ]);

        $baseUrl = "https://www.vlr.gg";
        $headers = [
            "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ];

        try {
            $urls = ["/events", "/events/?page=2", "/events/?page=3", "/events/?page=4", "/events/?page=5"];
            $records = 0;

            foreach ($urls as $url) {
                $response = Http::timeout(30)->withoutVerifying()->withHeaders($headers)->get($baseUrl . $url);
                $crawler = new Crawler($response->body());

                $crawler->filter(".event-item")->each(function (Crawler $node) use (&$records) {
                    try {
                        $link = $node->attr("href");
                        $id = explode("/", $link)[2] ?? null;
                        $name = trim($node->filter(".event-item-title")->text(""));
                        
                        if ($id && $name) {
                            $isVct2026 = preg_match("/^vct 2026: (americas|pacific|emea|china) (kickoff|stage 1|stage 2)$/i", $name)
                                      || preg_match("/^valorant (masters|champions).*2026$/i", $name)
                                      || preg_match("/^vct (masters|champions).*2026$/i", $name);
                            
                            if ($isVct2026) {
                                $event = Event::updateOrCreate(
                                    ["vlr_event_id" => $id],
                                    [
                                        "name" => $name,
                                        "region" => "global",
                                        "start_date" => Carbon::now()->subDays(10), // simplified
                                        "end_date" => Carbon::now(),
                                    ]
                                );
                                
                                SyncEventJob::dispatch($event, $link)->onQueue('scrape-default');
                                $records++;
                            }
                        }
                    } catch (\Exception $e) {
                        // Skip malformed rows
                    }
                });
            }

            // Backfill: dispatch SyncEventJob for any DB events with vlr_event_id
            // that have 0 entries in match_scrape_queues (e.g. pushed off /events pagination)
            $orphanEvents = Event::whereNotNull('vlr_event_id')
                ->whereDoesntHave('matchScrapeQueues')
                ->get();

            foreach ($orphanEvents as $event) {
                $slug = Str::slug($event->name);
                $link = "/event/{$event->vlr_event_id}/{$slug}";
                SyncEventJob::dispatch($event, $link)->onQueue('scrape-low');
                $records++;
            }

            $log->update([
                "status" => "success",
                "finished_at" => now(),
                "records_processed" => $records
            ]);
        } catch (\Exception $e) {
            $log->update([
                "status" => "failed",
                "finished_at" => now(),
                "error_message" => $e->getMessage()
            ]);
            throw $e;
        }
    }
}

