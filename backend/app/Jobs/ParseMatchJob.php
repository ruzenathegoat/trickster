<?php

namespace App\Jobs;

use App\Models\Map;
use App\Models\MatchData;
use App\Models\MatchScrapeQueue;
use App\Models\Player;
use App\Models\PlayerMapStat;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\DomCrawler\Crawler;

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
        if (! Storage::exists($this->fileName)) {
            // If data already parsed by a prior job, just mark completed
            $matchDataCheck = MatchData::where('vlr_match_id', $this->queueItem->vlr_match_id)->first();
            if ($matchDataCheck && $matchDataCheck->winner_team_id) {
                $this->queueItem->update(['status' => 'completed', 'error_message' => null]);
            } elseif ($matchDataCheck) {
                $this->queueItem->update(['status' => 'pending', 'error_message' => 'Pending: Waiting for match to finish or stats to be available']);
            } else {
                $this->queueItem->update(['status' => 'failed', 'error_message' => 'HTML file missing for parsing']);
            }

            return;
        }

        try {
            $html = Storage::get($this->fileName);
            $crawler = new Crawler($html);

            $players = [];
            $invalidStats = false;
            $validStatRows = 0;

            // Get MatchData to find team_a_id and team_b_id
            $matchData = MatchData::where('vlr_match_id', $this->queueItem->vlr_match_id)->first();
            $teamIds = [
                $matchData ? $matchData->team_a_id : null,
                $matchData ? $matchData->team_b_id : null,
            ];

            if ($matchData) {
                $map = Map::firstOrCreate([
                    'match_id' => $matchData->id,
                    'map_name' => 'All Maps',
                ]);
            } else {
                $map = null;
            }

            // Extract Players from the "all" stats table
            $crawler->filter('.vm-stats-game[data-game-id="all"] .ovw-scroll-wrap')->each(function (Crawler $teamTable, $i) use (&$players, &$invalidStats, &$validStatRows, $teamIds, $matchData, $map) {
                $teamId = $teamIds[$i] ?? null;

                $teamTable->filter('.ovw-row')->each(function (Crawler $row) use (&$players, &$invalidStats, &$validStatRows, $teamId, $matchData, $map) {
                    // Skip header rows
                    if ($row->filter('.ovw-th')->count() > 0) {
                        return;
                    }

                    $playerCell = $row->filter('.ovw-player');
                    if ($playerCell->count() > 0) {
                        $a = $playerCell->filter('a');
                        if ($a->count() > 0) {
                            $href = $a->attr('href');
                            $parts = explode('/', $href);
                            $vlrId = $parts[2] ?? null;
                            $name = trim($a->filter('.ovw-player-name')->text(''));

                            $country = null;
                            $flag = $row->filter('.flag');
                            if ($flag->count() > 0) {
                                $class = $flag->attr('class');
                                if (preg_match('/mod-([a-z0-9]+)/', $class, $matches)) {
                                    $country = $matches[1];
                                }
                            }

                            if ($vlrId && $name) {
                                // Save or Update Player
                                $player = Player::updateOrCreate(
                                    ['vlr_player_id' => $vlrId],
                                    [
                                        'ign' => $name,
                                        'name' => $name,
                                        'team_id' => $teamId,
                                        'country' => $country,
                                    ]
                                );

                                $readNumber = static function (Crawler $statRow, string $selector, bool $percentage = false): int|float|null {
                                    $nodes = $statRow->filter($selector);
                                    if ($nodes->count() === 0) {
                                        return null;
                                    }

                                    $raw = trim($nodes->text(''));
                                    if ($percentage) {
                                        $raw = str_replace('%', '', $raw);
                                    }

                                    return is_numeric($raw) ? (float) $raw : null;
                                };

                                $kills = $readNumber($row, '.ovw-kda-stat[data-col="kills"] .mod-both');
                                $deaths = $readNumber($row, '.ovw-kda-stat[data-col="deaths"] .mod-both');
                                $assists = $readNumber($row, '.ovw-kda-stat[data-col="assists"] .mod-both');
                                $acs = $readNumber($row, '.ovw-cell[data-col="acs"] .mod-both');
                                $kast = $readNumber($row, '.ovw-cell[data-col="kast"] .mod-both', true);
                                $adr = $readNumber($row, '.ovw-cell[data-col="adr"] .mod-both');
                                $rating = $readNumber($row, '.ovw-cell[data-col="rating2"] .mod-both');
                                $fk = $readNumber($row, '.ovw-cell[data-col="fb"] .mod-both');
                                $fd = $readNumber($row, '.ovw-cell[data-col="fd"] .mod-both');

                                $requiredStats = [$kills, $deaths, $assists, $acs, $kast, $adr, $rating, $fk, $fd];
                                if (in_array(null, $requiredStats, true) || $acs <= 0) {
                                    $invalidStats = true;

                                    return;
                                }

                                if ($matchData) {
                                    PlayerMapStat::updateOrCreate(
                                        [
                                            'match_id' => $matchData->id,
                                            'player_id' => $player->id,
                                            'map_id' => $map->id,
                                        ],
                                        [
                                            'kills' => $kills,
                                            'deaths' => $deaths,
                                            'assists' => $assists,
                                            'acs' => $acs,
                                            'kast' => $kast,
                                            'adr' => $adr,
                                            'rating' => $rating,
                                            'fk' => $fk,
                                            'fd' => $fd,
                                        ]
                                    );
                                }

                                $players[] = $player;
                                $validStatRows++;
                            }
                        }
                    }
                });
            });

            // Extract Agent picks from individual map tabs
            $hasCompleteStats = ! $invalidStats && $validStatRows >= 10;

            if ($matchData && $hasCompleteStats) {
                $crawler->filter('.vm-stats-game')->each(function (Crawler $mapStats) use ($matchData) {
                    $gameId = $mapStats->attr('data-game-id');
                    if (! $gameId || $gameId === 'all') {
                        return;
                    }

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
                        ['match_id' => $matchData->id, 'map_name' => 'Game '.$gameId],
                        ['valorant_map_name' => $actualMapName]
                    );

                    if ($map->valorant_map_name !== $actualMapName && $actualMapName) {
                        $map->update(['valorant_map_name' => $actualMapName]);
                    }

                    $mapStats->filter('.ovw-row')->each(function (Crawler $row) use ($map, $matchData) {
                        if ($row->filter('.ovw-th')->count() > 0) {
                            return;
                        }

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
                                        DB::table('player_match_agents')->updateOrInsert(
                                            [
                                                'player_id' => $player->id,
                                                'match_id' => $matchData->id,
                                                'map_id' => $map->id,
                                                'agent_name' => strtolower($agentName),
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

            // Re-fetch match data to check if winner was set during SyncMatchJob
            $matchDataCheck = MatchData::where('vlr_match_id', $this->queueItem->vlr_match_id)->first();

            if ($matchDataCheck && $matchDataCheck->winner_team_id && $hasCompleteStats) {
                $this->queueItem->update(['status' => 'completed', 'error_message' => null]);
            } else {
                if ($matchData && ! $hasCompleteStats) {
                    PlayerMapStat::where('match_id', $matchData->id)
                        ->where('map_id', $map?->id)
                        ->delete();
                }

                $reason = $invalidStats || $validStatRows > 0
                    ? "Pending: Invalid or incomplete player statistics ({$validStatRows}/10 valid rows)"
                    : 'Pending: Waiting for match to finish or stats to be available';

                $this->queueItem->update(['status' => 'pending', 'error_message' => $reason]);
            }

            if ($matchDataCheck && $matchDataCheck->winner_team_id && $hasCompleteStats) {
                CalculateMetricJob::dispatch($this->queueItem->vlr_match_id, $players)->onQueue('scrape-default');
            }

        } catch (\Exception $e) {
            $this->queueItem->update(['status' => 'failed', 'error_message' => 'Parsing failed: '.$e->getMessage()]);
            throw $e;
        }
    }
}
