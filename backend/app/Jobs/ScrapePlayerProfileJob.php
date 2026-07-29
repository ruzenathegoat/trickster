<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Player;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use Illuminate\Support\Facades\Log;

class ScrapePlayerProfileJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $player;

    /**
     * Create a new job instance.
     */
    public function __construct(Player $player)
    {
        $this->player = $player;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $url = 'https://www.vlr.gg/player/' . $this->player->vlr_player_id;
        
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        ];

        try {
            $response = Http::timeout(30)->withoutVerifying()->withHeaders($headers)->get($url);
            
            if (!$response->successful()) {
                throw new \Exception("Failed to fetch player page: " . $response->status());
            }

            $crawler = new Crawler($response->body());
            
            $img = $crawler->filter('.player-header img');
            if ($img->count() > 0) {
                $src = $img->attr('src');
                if ($src && str_contains($src, 'owcdn.net')) {
                    if (str_starts_with($src, '//')) {
                        $src = 'https:' . $src;
                    }
                    $this->player->update(['photo_url' => $src]);
                    Log::info("Updated photo for player {$this->player->ign} ({$this->player->vlr_player_id})");
                }
            }

            // Sleep to avoid rate limiting
            sleep(1);
        } catch (\Exception $e) {
            Log::error("Failed to scrape player profile for {$this->player->vlr_player_id}: " . $e->getMessage());
        }
    }
}
