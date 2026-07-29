<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Player;
use App\Models\PlayerMapStat;
use App\Models\MatchData;

class CalculateMetricJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $matchId;
    public $players;

    public function __construct(string $matchId, array $players)
    {
        $this->matchId = $matchId;
        $this->players = $players;
    }

    public function handle(): void
    {
        foreach ($this->players as $playerModel) {
            $player = Player::find($playerModel->id);
            if (!$player) continue;

            $stats = PlayerMapStat::where("player_id", $player->id)->get();
            if ($stats->isEmpty()) continue;

            $totalMatches = $stats->count();
            $totalKills = $stats->sum("kills");
            $totalDeaths = $stats->sum("deaths");
            $totalAssists = $stats->sum("assists");

            // Count wins: matches where this player's team won
            $matchIds = $stats->pluck("match_id")->unique();
            $totalWins = MatchData::whereIn("id", $matchIds)
                ->where("winner_team_id", $player->team_id)
                ->count();

            // Calculate Consistency Index (CI)
            $consistencyIndex = null;
            if ($totalMatches >= 20) {
                // Calculate standard deviation of ACS
                $avgAcs = $stats->avg("acs");
                if ($avgAcs > 0) {
                    $variance = 0;
                    foreach ($stats as $stat) {
                        $variance += pow($stat->acs - $avgAcs, 2);
                    }
                    $variance /= $totalMatches;
                    $stdDev = sqrt($variance);
                    
                    // Coefficient of Variation = (StdDev / Mean)
                    // Consistency Index = 100 - (CV * 100)
                    $cv = $stdDev / $avgAcs;
                    $ciValue = 100 - ($cv * 100);
                    // Ensure CI is between 0 and 100
                    $consistencyIndex = round(max(0, min(100, $ciValue)), 2);
                }
            }

            // Calculate Current Role
            $agentPicks = \Illuminate\Support\Facades\DB::table('player_match_agents')
                ->join('matches', 'player_match_agents.match_id', '=', 'matches.id')
                ->where('player_match_agents.player_id', $player->id)
                ->select('player_match_agents.agent_name', 'matches.event_id', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                ->groupBy('player_match_agents.agent_name', 'matches.event_id')
                ->get();

            $currentRole = null;
            if ($agentPicks->isNotEmpty()) {
                $rolesPerEvent = [];
                $overallRoles = [];

                foreach ($agentPicks as $pick) {
                    $roleRecord = \Illuminate\Support\Facades\DB::table('agent_role_maps')
                        ->where('agent_name', strtolower($pick->agent_name))
                        ->first();
                        
                    if ($roleRecord) {
                        $roleName = ucfirst($roleRecord->role_name);
                        
                        // Track per event
                        $eventId = $pick->event_id;
                        if (!isset($rolesPerEvent[$eventId])) {
                            $rolesPerEvent[$eventId] = [];
                        }
                        $rolesPerEvent[$eventId][$roleName] = true;
                        
                        // Track overall
                        if (!isset($overallRoles[$roleName])) {
                            $overallRoles[$roleName] = 0;
                        }
                        $overallRoles[$roleName] += $pick->count;
                    }
                }
                
                $isFlex = false;
                foreach ($rolesPerEvent as $eventId => $roles) {
                    if (count($roles) > 2) { // Played more than 2 distinct roles in this event
                        $isFlex = true;
                        break;
                    }
                }
                
                if ($isFlex) {
                    $currentRole = 'Flex';
                } elseif (count($overallRoles) > 0) {
                    arsort($overallRoles);
                    $currentRole = array_key_first($overallRoles);
                }
            }

            $player->update([
                "total_matches" => $totalMatches,
                "total_wins" => $totalWins,
                "win_rate" => $totalMatches > 0 ? round(($totalWins / $totalMatches) * 100, 2) : 0,
                "avg_acs" => round($stats->avg("acs"), 1),
                "avg_kd" => $totalDeaths > 0 ? round($totalKills / $totalDeaths, 2) : $totalKills,
                "avg_kast" => round($stats->avg("kast"), 1),
                "avg_adr" => round($stats->avg("adr"), 1),
                "avg_rating" => round($stats->filter(fn($s) => $s->rating > 0)->avg("rating") ?? 0, 2),
                "total_kills" => $totalKills,
                "total_deaths" => $totalDeaths,
                "total_assists" => $totalAssists,
                "consistency_index" => $consistencyIndex,
                "current_role" => $currentRole ?? $player->current_role,
            ]);
        }

        // Pass to the next phase: AI Smart Results
        CalculateSmartJob::dispatch($this->matchId, $this->players);
    }
}
