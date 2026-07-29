<?php

require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\MatchData;
use App\Models\Player;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use Illuminate\Support\Facades\DB;
use App\Jobs\CalculateMetricJob;

$matches = MatchData::all();
$total = $matches->count();
$count = 0;

echo "Starting agent backfill for {$total} matches...\n";

foreach ($matches as $match) {
    $count++;
    
    $hasAgents = false;
    $retryCount = 0;
    while ($retryCount < 3) {
        try {
            $hasAgents = DB::table('player_match_agents')->where('match_id', $match->id)->exists();
            break;
        } catch (\Exception $e) {
            echo "  DB Error checking agents, retrying...\n";
            sleep(2);
            $retryCount++;
        }
    }
    
    if ($hasAgents) {
        // We still dispatch calculate metric job because players might need it
        $players = Player::whereIn('id', DB::table('player_map_stats')->where('match_id', $match->id)->pluck('player_id'))->get();
        if ($players->isNotEmpty()) {
            CalculateMetricJob::dispatch($match->id, $players->all())->onQueue('default');
        }
        continue;
    }

    echo "[{$count}/{$total}] Fetching match {$match->vlr_match_id}...\n";
    try {
        $response = Http::timeout(30)->withoutVerifying()->get("https://www.vlr.gg/{$match->vlr_match_id}");
        if (!$response->successful()) continue;
        
        $crawler = new Crawler($response->body());
        $crawler->filter('.vm-stats-game')->each(function (Crawler $mapStats) use ($match) {
            $gameId = $mapStats->attr('data-game-id');
            if (!$gameId || $gameId === 'all') return;
            
            $map = \App\Models\Map::firstOrCreate([
                'match_id' => $match->id, 
                'map_name' => 'Game ' . $gameId
            ]);
            
            $mapStats->filter('.ovw-row')->each(function (Crawler $row) use ($match, $map) {
                if ($row->filter('.ovw-th')->count() > 0) return;
                
                $playerLink = $row->filter('.ovw-player a');
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
                                        'map_id' => $map->id,
                                        'agent_name' => strtolower($agentName)
                                    ],
                                    [
                                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                    ]
                                );
                            }
                        }
                    }
                }
            });
        });
        
        $retryCount = 0;
        while ($retryCount < 3) {
            try {
                $players = Player::whereIn('id', DB::table('player_map_stats')->where('match_id', $match->id)->pluck('player_id'))->get();
                if ($players->isNotEmpty()) {
                    CalculateMetricJob::dispatch($match->id, $players->all())->onQueue('default');
                }
                break;
            } catch (\Exception $e) {
                echo "  DB Error fetching players, retrying...\n";
                sleep(2);
                $retryCount++;
            }
        }
    } catch (\Exception $e) {
        echo "  Error: " . $e->getMessage() . "\n";
    }
}

echo "Done!\n";
