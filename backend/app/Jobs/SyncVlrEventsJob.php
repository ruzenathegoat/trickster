<?php

namespace App\Jobs;

use App\Models\Event;
use App\Models\ScrapeJobsLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class SyncVlrEventsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $log = ScrapeJobsLog::create([
            'source' => '/events',
            'status' => 'started',
            'started_at' => now(),
            'records_processed' => 0,
        ]);

        $baseUrl = 'https://www.vlr.gg';
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ];

        try {
            // The unfiltered event list is position-based and moves older VCT
            // events beyond an arbitrary page boundary. The VCT tier endpoint
            // keeps the official circuit discoverable without scanning dozens
            // of unrelated tournament pages.
            $urls = ['/events/?tier=60'];
            $records = 0;

            foreach ($urls as $url) {
                $response = Http::timeout(30)->withoutVerifying()->withHeaders($headers)->get($baseUrl.$url);
                $response->throw();
                $crawler = new Crawler($response->body());

                $crawler->filter('.event-item')->each(function (Crawler $node) use (&$records) {
                    try {
                        $link = $node->attr('href');
                        $id = explode('/', $link)[2] ?? null;
                        $name = trim($node->filter('.event-item-title')->text(''));

                        if ($id && $name) {
                            $isVct2026 = preg_match('/^vct 2026: (americas|pacific|emea|china) (kickoff|stage 1|stage 2)$/i', $name)
                                      || preg_match('/^valorant (masters|champions).*2026$/i', $name)
                                      || preg_match('/^vct (masters|champions).*2026$/i', $name);

                            if ($isVct2026) {
                                $region = match (true) {
                                    preg_match('/Americas/i', $name) === 1 => 'Americas',
                                    preg_match('/Pacific/i', $name) === 1 => 'Pacific',
                                    preg_match('/EMEA/i', $name) === 1 => 'EMEA',
                                    preg_match('/China/i', $name) === 1 => 'China',
                                    default => 'International',
                                };

                                $event = Event::updateOrCreate(
                                    ['vlr_event_id' => $id],
                                    [
                                        'name' => $name,
                                        'region' => $region,
                                    ]
                                );

                                SyncEventJob::dispatch($event, $link)->onQueue('scrape-default');
                                $records++;
                            }
                        }
                    } catch (\Exception $e) {
                        \Log::warning('Skipped malformed VLR event row', [
                            'error' => $e->getMessage(),
                        ]);
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
                'status' => 'success',
                'finished_at' => now(),
                'records_processed' => $records,
            ]);
        } catch (\Exception $e) {
            $log->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
