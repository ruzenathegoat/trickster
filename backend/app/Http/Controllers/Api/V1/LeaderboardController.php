<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Player;

class LeaderboardController extends Controller
{
    /**
     * Get the top 3 players for the leaderboard overview.
     */
    public function index()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('api_leaderboard_top', 3600, function() {
            $topResults = \Illuminate\Support\Facades\DB::table('player_smart_results')
                ->join('players', 'players.id', '=', 'player_smart_results.player_id')
                ->leftJoin('teams', 'teams.id', '=', 'players.team_id')
                ->select(
                    'player_smart_results.final_score',
                    'player_smart_results.mode',
                    'players.id',
                    'players.ign',
                    'players.photo_url',
                    'players.current_role',
                    'players.avg_acs',
                    'players.avg_kd',
                    'teams.name as team_name'
                )
                ->orderBy('player_smart_results.final_score', 'desc')
                ->take(3)
                ->get();

            $mapped = [];
            foreach ($topResults as $index => $result) {
                $mapped[] = [
                    'id' => $result->id,
                    'rank' => $index + 1,
                    'ign' => $result->ign,
                    'team_name' => $result->team_name ?? 'Free Agent',
                    'photo_url' => $result->photo_url,
                    'rating' => round($result->final_score, 1),
                    'role' => $result->mode !== 'overall' ? ucfirst($result->mode) : ($result->current_role ?? 'Flex'),
                    'acs' => round($result->avg_acs, 1),
                    'kd' => round($result->avg_kd, 2)
                ];
            }
            return $mapped;
        });

        return response()->json($data);
    }

    /**
     * Get paginated leaderboard players with optional role filter.
     */
    public function players(Request $request)
    {
        $role = $request->role ?? 'All';
        $page = $request->get('page', 1);
        $cacheKey = 'api_leaderboard_players_role_' . md5($role) . '_page_' . $page;

        $paginatorArray = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function() use ($role) {
            $query = \Illuminate\Support\Facades\DB::table('player_smart_results')
                ->join('players', 'players.id', '=', 'player_smart_results.player_id')
                ->leftJoin('teams', 'teams.id', '=', 'players.team_id')
                ->select(
                    'player_smart_results.final_score',
                    'player_smart_results.mode',
                    'players.id',
                    'players.ign',
                    'players.photo_url',
                    'players.current_role',
                    'players.avg_acs',
                    'players.avg_kd',
                    'teams.name as team_name'
                )
                ->orderBy('player_smart_results.final_score', 'desc');

            if ($role !== 'All') {
                $query->where('players.current_role', $role);
            }

            $paginated = $query->paginate(10);
            
            // Map the items to arrays
            $paginated->getCollection()->transform(function ($result) {
                return [
                    'id' => $result->id,
                    'ign' => $result->ign,
                    'team_name' => $result->team_name ?? 'Free Agent',
                    'photo_url' => $result->photo_url,
                    'rating' => round($result->final_score, 1),
                    'role' => $result->current_role ?? 'Flex',
                    'acs' => round($result->avg_acs, 1),
                    'kd' => round($result->avg_kd, 2)
                ];
            });
            
            return $paginated->toArray();
        });

        return response()->json($paginatorArray);
    }

    /**
     * Get detailed player profile including radar chart stats.
     */
    public function show($id)
    {
        $cacheKey = 'api_player_profile_' . $id;

        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function() use ($id) {
            $player = Player::with('team')->findOrFail($id);

            // Calculate most picked agents safely handling case sensitivity
            $agentPicks = \Illuminate\Support\Facades\DB::table('player_match_agents')
                ->where('player_id', $player->id)
                ->select('agent_name', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                ->groupBy('agent_name')
                ->orderBy('count', 'desc')
                ->get();
                
            $agentsMap = \Illuminate\Support\Facades\DB::table('valorant_agents')->get()->keyBy(function($item) {
                return preg_replace('/[^a-z0-9]/', '', strtolower($item->name));
            });

            $mostPickedAgents = [];
            $totalPicks = $agentPicks->sum('count');
            if ($totalPicks > 0) {
                foreach ($agentPicks as $pick) {
                    $normalizedPick = preg_replace('/[^a-z0-9]/', '', strtolower($pick->agent_name));
                    $agentMeta = $agentsMap->get($normalizedPick);
                    $mostPickedAgents[] = [
                        'name' => $agentMeta ? $agentMeta->name : ucfirst($pick->agent_name),
                        'count' => $pick->count,
                        'icon_url' => $agentMeta ? $agentMeta->icon_url : null,
                        'percentage' => round(($pick->count / $totalPicks) * 100, 1) . '%'
                    ];
                }
            }

            // Normalize stats for 0-100 radar chart
            $stats = [
                'ACS' => $this->normalize($player->avg_acs, 150, 300),
                'K/D' => $this->normalize($player->avg_kd, 0.7, 1.5),
                'KAST' => $this->normalize($player->avg_kast, 60, 90),
                'ADR' => $this->normalize($player->avg_adr, 100, 200),
                'Adaptability' => $this->normalize($player->meta_adaptability_index ?? 50, 0, 100),
                'Flexibility' => $this->normalize($player->flexibility_score ?? 50, 0, 100),
            ];

            // Calculate SMART Rank
            $smartResult = \App\Models\PlayerSmartResult::where('player_id', $player->id)->where('mode', 'career')->first();
            $smartScore = null;
            $smartRank = null;
            $rankHistory = [];
            $rankShift = null;

            if ($smartResult) {
                $smartScore = round($smartResult->final_score, 1);
                $smartRank = \App\Models\PlayerSmartResult::where('mode', 'career')
                                ->where('final_score', '>', $smartResult->final_score)
                                ->count() + 1;
                                
                // Fetch historical snapshots for the last 30 days
                $historyRecords = \Illuminate\Support\Facades\DB::table('player_smart_rank_history')
                    ->where('player_id', $player->id)
                    ->where('mode', 'career')
                    ->where('snapshot_date', '>=', now()->subDays(30)->format('Y-m-d'))
                    ->orderBy('snapshot_date', 'asc')
                    ->get();
                    
                foreach ($historyRecords as $record) {
                    $rankHistory[] = [
                        'date' => $record->snapshot_date,
                        'rank' => $record->rank
                    ];
                }
                
                // If the latest snapshot doesn't include today (because calculation hasn't run yet today),
                // we should still append today's LIVE rank so the chart is always up-to-date with their current standing.
                $todayStr = now()->format('Y-m-d');
                $hasToday = false;
                foreach ($rankHistory as $h) {
                    if ($h['date'] === $todayStr) {
                        $hasToday = true;
                        break;
                    }
                }
                if (!$hasToday && $smartRank !== null) {
                    $rankHistory[] = [
                        'date' => $todayStr,
                        'rank' => $smartRank
                    ];
                }
                
                // Calculate Rank Shift: Compare today's rank vs the most recent past snapshot
                $rankShift = null;
                if (count($rankHistory) > 1) {
                    $latest = $rankHistory[count($rankHistory) - 1]['rank'];
                    $previous = $rankHistory[count($rankHistory) - 2]['rank'];
                    
                    $rawShift = $previous - $latest;
                    if ($rawShift > 0) {
                        $rankShift = '+' . $rawShift;
                    } elseif ($rawShift < 0) {
                        $rankShift = (string)$rawShift;
                    } else {
                        $rankShift = '0';
                    }
                }
            }

            return [
                'id' => $player->id,
                'ign' => $player->ign,
                'name' => $player->name,
                'country' => $player->country,
                'team_name' => $player->team ? $player->team->name : 'Free Agent',
                'team_logo' => $player->team ? $player->team->logo_url : null,
                'photo_url' => $player->photo_url,
                'role' => $player->current_role ?? 'Flex',
                'smart_score' => $smartScore,
                'smart_rank' => $smartRank,
                'smart_rank_history' => $rankHistory,
                'rank_shift' => $rankShift,
                'raw_stats' => [
                    'matches' => $player->total_matches,
                    'win_rate' => round($player->win_rate, 1) . '%',
                    'rating' => round($player->avg_rating, 2),
                    'acs' => round($player->avg_acs, 1),
                    'kd' => round($player->avg_kd, 2),
                    'kast' => round($player->avg_kast, 1) . '%',
                    'adr' => round($player->avg_adr, 1),
                ],
                'radar_stats' => $stats,
                'most_picked_agents' => $mostPickedAgents
            ];
        });

        return response()->json($data);
    }

    private function normalize($value, $min, $max)
    {
        if ($value <= $min) return 10; // floor at 10% so the chart doesn't look totally collapsed
        if ($value >= $max) return 100;
        return round((($value - $min) / ($max - $min)) * 90 + 10); // Scale between 10-100
    }
}
