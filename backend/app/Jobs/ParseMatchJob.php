<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\MatchScrapeQueue;
use App\Models\MatchData;
use App\Models\Player;
use App\Models\Map;
use App\Models\PlayerMapStat;

class ParseMatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $queueItem;
    public $fileName;

    public function __construct(MatchScrapeQueue $queueItem, string $fileName)
    {
        $this->queueItem = $queueItem;
        $this->fileName = $fileName;
    }

    public function handle(): void
    {
        if (!Storage::exists($this->fileName)) {
            // If data already parsed by a prior job, just mark completed
            if (MatchData::where("vlr_match_id", $this->queueItem->vlr_match_id)->exists()) {
                $this->queueItem->update(["status" => "completed"]);
            } else {
                $this->queueItem->update(["status" => "failed", "error_message" => "HTML file missing for parsing"]);
            }
            return;
        }

        try {
            $html = Storage::get($this->fileName);
            $crawler = new Crawler($html);
            
            $players = [];
            
            // Get MatchData to find team_a_id and team_b_id
            $matchData = MatchData::where("vlr_match_id", $this->queueItem->vlr_match_id)->first();
            $teamIds = [
                $matchData ? $matchData->team_a_id : null,
                $matchData ? $matchData->team_b_id : null
            ];
            
            if ($matchData) {
                $map = Map::firstOrCreate([
                    "match_id" => $matchData->id,
                    "map_name" => "All Maps"
                ]);
            } else {
                $map = null;
            }

            // Extract Players from the "all" stats table
            $crawler->filter('.vm-stats-game[data-game-id="all"] .ovw-scroll-wrap')->each(function (Crawler $teamTable, $i) use (&$players, $teamIds, $matchData, $map) {
                $teamId = $teamIds[$i] ?? null;
                
                $teamTable->filter(".ovw-row")->each(function (Crawler $row) use (&$players, $teamId, $matchData, $map) {
                    // Skip header rows
                    if ($row->filter('.ovw-th')->count() > 0) return;
                    
                    $playerCell = $row->filter(".ovw-player");
                    if($playerCell->count() > 0) {
                        $a = $playerCell->filter("a");
                        if ($a->count() > 0) {
                            $href = $a->attr("href");
                            $parts = explode("/", $href);
                            $vlrId = $parts[2] ?? null;
                            $name = trim($a->filter(".ovw-player-name")->text(""));
                            
                            $country = null;
                            $flag = $row->filter(".flag");
                            if($flag->count() > 0) {
                                $class = $flag->attr("class");
                                if (preg_match("/mod-([a-z0-9]+)/", $class, $matches)) {
                                    $country = $matches[1];
                                }
                            }

                            if ($vlrId && $name) {
                                // Save or Update Player
                                $player = Player::updateOrCreate(
                                    ["vlr_player_id" => $vlrId],
                                    [
                                        "ign" => $name, 
                                        "name" => $name,
                                        "team_id" => $teamId,
                                        "country" => $country
                                    ]
                                );
                                
                                // Extract Stats safely
                                try {
                                    $kills = trim($row->filter('.ovw-kda-stat[data-col="kills"] .mod-both')->text("0"));
                                    $deaths = trim($row->filter('.ovw-kda-stat[data-col="deaths"] .mod-both')->text("0"));
                                    $assists = trim($row->filter('.ovw-kda-stat[data-col="assists"] .mod-both')->text("0"));
                                    $acs = trim($row->filter('.ovw-cell[data-col="acs"] .mod-both')->text("0"));
                                    $kast = trim(str_replace("%", "", $row->filter('.ovw-cell[data-col="kast"] .mod-both')->text("0")));
                                    $adr = trim($row->filter('.ovw-cell[data-col="adr"] .mod-both')->text("0"));
                                    $rating = trim($row->filter('.ovw-cell[data-col="rating2"] .mod-both')->text("0"));
                                    $fk = trim($row->filter('.ovw-cell[data-col="fb"] .mod-both')->text("0"));
                                    $fd = trim($row->filter('.ovw-cell[data-col="fd"] .mod-both')->text("0"));
                                } catch (\Exception $e) {
                                    $kills = 0; $deaths = 0; $assists = 0; $acs = 0; $kast = 0; $adr = 0; $rating = 0; $fk = 0; $fd = 0;
                                }

                                if ($matchData) {
                                    PlayerMapStat::updateOrCreate(
                                        [
                                            "match_id" => $matchData->id,
                                            "player_id" => $player->id,
                                            "map_id" => $map->id,
                                        ],
                                        [
                                            "kills" => is_numeric($kills) ? $kills : 0,
                                            "deaths" => is_numeric($deaths) ? $deaths : 0,
                                            "assists" => is_numeric($assists) ? $assists : 0,
                                            "acs" => is_numeric($acs) ? $acs : 0,
                                            "kast" => is_numeric($kast) ? $kast : 0,
                                            "adr" => is_numeric($adr) ? $adr : 0,
                                            "rating" => is_numeric($rating) ? $rating : null,
                                            "fk" => is_numeric($fk) ? $fk : 0,
                                            "fd" => is_numeric($fd) ? $fd : 0,
                                        ]
                                    );
                                }
                                
                                $players[] = $player;
                            }
                        }
                    }
                });
            });

            // Extract Agent picks from individual map tabs
            if ($matchData) {
                $crawler->filter('.vm-stats-game')->each(function (Crawler $mapStats) use ($matchData) {
                    $gameId = $mapStats->attr('data-game-id');
                    if (!$gameId || $gameId === 'all') return;
                    
                    // Extract the actual map name
                    $mapNameRaw = '';
                    if ($mapStats->filter('.map')->count() > 0) {
                        $mapNameRaw = trim(preg_replace('/\s+/', ' ', $mapStats->filter('.map')->text()));
                        $mapNameRaw = trim(str_replace('PICK', '', $mapNameRaw));
                    }
                    // e.g. " Ascent " -> "Ascent"
                    $actualMapName = preg_replace('/[^a-zA-Z]/', '', $mapNameRaw);
                    if (empty($actualMapName)) {
                        $actualMapName = null;
                    }
                    
                    $map = Map::firstOrCreate(
                        ['match_id' => $matchData->id, 'map_name' => 'Game ' . $gameId],
                        ['valorant_map_name' => $actualMapName]
                    );
                    
                    if ($map->valorant_map_name !== $actualMapName && $actualMapName) {
                        $map->update(['valorant_map_name' => $actualMapName]);
                    }
                    
                    $mapStats->filter('.ovw-row')->each(function (Crawler $row) use ($map, $matchData) {
                        if ($row->filter('.ovw-th')->count() > 0) return;
                        
                        $a = $row->filter('.ovw-player a');
                        if ($a->count() > 0) {
                            $href = $a->attr('href');
                            $parts = explode('/', $href);
                            $vlrId = $parts[2] ?? null;
                            
                            $agentImg = $row->filter('.ovw-agents img');
                            if ($vlrId && $agentImg->count() > 0) {
                                $agentName = trim($agentImg->attr('title'));
                                if ($agentName) {
                                    $player = Player::where('vlr_player_id', $vlrId)->first();
                                    if ($player) {
                                        \Illuminate\Support\Facades\DB::table('player_match_agents')->updateOrInsert(
                                            [
                                                'player_id' => $player->id,
                                                'match_id' => $matchData->id,
                                                'map_id' => $map->id,
                                                'agent_name' => strtolower($agentName)
                                            ],
                                            [
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
            }

            // Delete temporary HTML
            Storage::delete($this->fileName);
            $this->queueItem->update(["status" => "completed"]);

            // Dispatch CalculateMetricJob
            CalculateMetricJob::dispatch($this->queueItem->vlr_match_id, $players)->onQueue("scrape-default");

        } catch (\Exception $e) {
            $this->queueItem->update(["status" => "failed", "error_message" => "Parsing failed: " . $e->getMessage()]);
            throw $e;
        }
    }
}

