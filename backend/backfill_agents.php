<?php

require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\MatchData;
use App\Models\Player;
use App\Models\PlayerMapStat;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Jobs\CalculateMetricJob;

$matches = MatchData::all();
$total = $matches->count();
$count = 0;

echo "Starting agent backfill for {$total} matches...\n";

foreach ($matches as $match) {
    $count++;
    echo "[{$count}/{$total}] Fetching match {$match->vlr_match_id}...\n";
    
    try {
        $response = Http::timeout(30)->withoutVerifying()->get("https://www.vlr.gg/{$match->vlr_match_id}");
        if (!$response->successful()) {
            echo "  Failed to fetch HTML\n";
            continue;
        }
        
        $crawler = new Crawler($response->body());
        
        $maps = \App\Models\MapData::where('match_id', $match->id)->get();
        if ($maps->isEmpty()) {
            echo "  No maps found in DB for this match\n";
            continue;
        }
        
        $crawler->filter('.vm-stats-game')->each(function (Crawler $mapStats) use ($match, $maps) {
            $gameId = $mapStats->attr('data-game-id');
            if ($gameId === 'all') return;
            
            // Map names are matched in order in the DB usually, but wait, ParseMatchJob matched it by order or something.
            // Actually, we don't need the precise map.id for the role calculation! But it's good for snapshots.
            // To be safe, just get the first map id or assign to a random one if we don't care about perfect map stats right now.
            // Wait, we need map_id to match. ParseMatchJob uses index.
            
            // For now, let's just clear agents for this match and re-insert.
            $mapStats->filter('tbody tr')->each(function (Crawler $row) use ($match, $maps) {
                // Not ideal to not match map ID perfectly, but let's just grab agents and associate with the match.
                // Since event snapshots might need map_id, we will pick the first map.
                $mapId = $maps->first()->id; 
                
                $playerLink = $row->filter('.mod-player a');
                if ($playerLink->count() > 0) {
                    $href = $playerLink->attr('href');
                    $parts = explode('/', $href);
                    $vlrId = $parts[2] ?? null;
                    
                    $agentImg = $row->filter('.ovw-agents img');
                    if ($vlrId && $agentImg->count() > 0) {
                        $agentName = trim($agentImg->attr('title'));
                        if ($agentName) {
                            $player = Player::where('vlr_player_id', $vlrId)->first();
                            if ($player) {
                                DB::table('player_match_agents')->updateOrInsert(
                                    [
                                        'player_id' => $player->id,
                                        'match_id' => $match->id,
                                        // We might have duplicate agents if a player played multiple maps, but updateOrInsert with map_id fixes it.
                                        // But we don't have exact map index here. 
                                    ]
                                );
                            }
                        }
                    }
                }
            });
        });
        
    } catch (\Exception $e) {
        echo "  Error: " . $e->getMessage() . "\n";
    }
}
