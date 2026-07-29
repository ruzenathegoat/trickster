<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Event;
use App\Models\MatchData;
use App\Models\Map;
use App\Models\PlayerMapStat;
use App\Models\Team;
use App\Models\Player;
use App\Models\ScrapeJobsLog;
use App\Models\MatchScrapeQueue;
use Illuminate\Support\Str;
use Carbon\Carbon;

class VlrScraperService
{
    protected string $baseUrl = 'https://www.vlr.gg';
    protected array $headers = [
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language' => 'en-US,en;q=0.9',
    ];

    public function fetchEvents(): int
    {
        $log = ScrapeJobsLog::create([
            'source' => '/events',
            'status' => 'started',
            'started_at' => now(),
            'records_processed' => 0
        ]);

        try {
            $events = $this->scrapeEvents();
            $records = 0;
            
            foreach ($events as $event) {
                try {
                    $matches = $this->scrapeEventMatches($event['id'], $event['link']);
                    $records += count($matches);
                } catch (\Exception $e) {
                    \Log::error("Failed to scrape matches for event {$event['id']}: " . $e->getMessage());
                }
            }

            $log->update([
                'status' => 'success',
                'finished_at' => now(),
                'records_processed' => $records
            ]);

            return $records;
        } catch (\Exception $e) {
            $log->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_message' => $e->getMessage()
            ]);
            return 0;
        }
    }

    public function scrapeEvents(): array
    {
        $urls = ['/events', '/events/?page=2', '/events/?page=3', '/events/?page=4', '/events/?page=5'];
        $events = [];

        foreach ($urls as $url) {
            $response = Http::timeout(30)->withoutVerifying()->withHeaders($this->headers)->get($this->baseUrl . $url);
            $crawler = new Crawler($response->body());

            $crawler->filter('.event-item')->each(function (Crawler $node) use (&$events) {
            try {
                $link = $node->attr('href');
                $id = explode('/', $link)[2] ?? null;
                $name = trim($node->filter('.event-item-title')->text(''));
                $statusText = $node->filter('.event-item-status')->count() ? trim($node->filter('.event-item-status')->text('')) : 'completed';
                $status = strtolower($statusText) === 'completed' ? 'completed' : 'ongoing';

                if ($id && $name) {
                    $lowerName = strtolower($name);
                    // Strict filter for VCT 2026 Tier 1 events only
                    $isVct2026 = preg_match('/^vct 2026: (americas|pacific|emea|china) (kickoff|stage 1|stage 2)$/i', $name)
                              || preg_match('/^valorant (masters|champions).*2026$/i', $name)
                              || preg_match('/^vct (masters|champions).*2026$/i', $name);
                    
                    if ($isVct2026) {
                        Event::updateOrCreate(
                            ['vlr_event_id' => $id],
                            [
                                'name' => $name,
                                'region' => 'global',
                                'start_date' => Carbon::now()->subDays(10), // simplified
                                'end_date' => Carbon::now(),
                            ]
                        );

                        $events[] = [
                            'id' => $id,
                            'name' => $name,
                            'link' => $link
                        ];
                    }
                }
            } catch (\Exception $e) {
                // skip malformed rows
            }
        });
        }

        return $events;
    }

    public function scrapeEventMatches(string $eventId, string $eventLink): array
    {
        $url = str_replace('/event/', '/event/matches/', $eventLink);
        $response = Http::timeout(30)->withoutVerifying()->withHeaders($this->headers)->get($this->baseUrl . $url);
        
        $crawler = new Crawler($response->body());
        $matches = [];

        $crawler->filter('.wf-card a.match-item')->each(function (Crawler $node) use (&$matches, $eventId) {
            try {
                $link = $node->attr('href');
                $matchId = explode('/', $link)[1] ?? null;
                
                if ($matchId) {
                    $event = Event::where('vlr_event_id', $eventId)->first();
                    if ($event) {
                        $queueItem = MatchScrapeQueue::firstOrCreate(
                            ['vlr_match_id' => $matchId],
                            [
                                'event_id' => $event->id,
                                'url' => $this->baseUrl . $link,
                                'status' => 'pending'
                            ]
                        );
                        
                        // Only dispatch if it's pending (new or failed previously)
                        if ($queueItem->status === 'pending') {
                            $eventName = strtolower($event->name);
                            $queue = 'scrape-low';
                            
                            if (str_contains($eventName, 'champions') || str_contains($eventName, 'masters')) {
                                $queue = 'scrape-high';
                            } elseif (str_contains($eventName, 'kickoff')) {
                                $queue = 'scrape-low';
                            } elseif (str_contains($eventName, 'stage') || str_contains($eventName, 'split')) {
                                $queue = 'scrape-default';
                            }

                            \App\Jobs\ProcessMatchScrapeJob::dispatch($queueItem)->onQueue($queue);
                        }

                        $matches[] = $matchId;
                    }
                }
            } catch (\Exception $e) {
            }
        });
        
        return $matches;
    }
}