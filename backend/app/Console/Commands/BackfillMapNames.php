<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MatchData;
use App\Models\Map;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

class BackfillMapNames extends Command
{
    protected $signature = 'trickster:backfill-maps';
    protected $description = 'Backfill valorant_map_name for existing matches';

    public function handle()
    {
        $matches = MatchData::whereHas('maps', function ($query) {
            $query->whereNull('valorant_map_name');
        })->get();

        $this->info("Found {$matches->count()} matches that need map names backfilled.");

        foreach ($matches as $match) {
            $this->info("Fetching match {$match->vlr_match_id}...");
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'TricksterBot/1.0',
                ])->get("https://www.vlr.gg/{$match->vlr_match_id}");

                if ($response->failed()) {
                    $this->error("Failed to fetch match {$match->vlr_match_id}");
                    continue;
                }

                $crawler = new Crawler($response->body());
                $crawler->filter('.vm-stats-game')->each(function (Crawler $mapStats) use ($match) {
                    $gameId = $mapStats->attr('data-game-id');
                    if (!$gameId || $gameId === 'all') return;

                    $mapNameRaw = '';
                    if ($mapStats->filter('.map')->count() > 0) {
                        $mapNameRaw = trim(preg_replace('/\s+/', ' ', $mapStats->filter('.map')->text()));
                        $mapNameRaw = trim(str_replace('PICK', '', $mapNameRaw));
                    }
                    $actualMapName = preg_replace('/[^a-zA-Z]/', '', $mapNameRaw);
                    
                    if (!empty($actualMapName)) {
                        Map::where('match_id', $match->id)
                           ->where('map_name', 'Game ' . $gameId)
                           ->update(['valorant_map_name' => $actualMapName]);
                        $this->info("Updated Game {$gameId} to {$actualMapName}");
                    }
                });
                
                // Sleep to avoid rate limits
                sleep(1);
            } catch (\Exception $e) {
                $this->error("Error processing match {$match->vlr_match_id}: " . $e->getMessage());
            }
        }
        
        $this->info("Done backfilling!");
    }
}
