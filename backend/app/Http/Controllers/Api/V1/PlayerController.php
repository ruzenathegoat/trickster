<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Player;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function index(Request $request)
    {
        // Layer 1 & 2 Caching: dynamic cache key based on query parameters
        $page = $request->get('page', 1);
        $q = $request->get('q', '');
        $role = $request->get('role', 'All');
        $sortBy = strtolower($request->get('sort_by', 'smart'));
        $sortDir = strtolower($request->get('sort_dir', 'desc'));
        $limit = (int) $request->get('limit', 20);
        
        $validSortDirs = ['asc', 'desc'];
        if (!in_array($sortDir, $validSortDirs)) {
            $sortDir = 'desc';
        }

        $version = \Illuminate\Support\Facades\Cache::get('api_admin_cache_version', 'v1');
        $cacheKey = 'api_players_explorer_' . $version . '_' . md5(json_encode(compact('page', 'q', 'role', 'sortBy', 'sortDir', 'limit')));

        $paginatorArray = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function() use ($q, $role, $sortBy, $sortDir, $limit) {
            $query = \Illuminate\Support\Facades\DB::table('players')
                ->leftJoin('teams', 'teams.id', '=', 'players.team_id')
                ->leftJoin('player_smart_results', function($join) {
                    $join->on('players.id', '=', 'player_smart_results.player_id')
                         ->where('player_smart_results.mode', '=', 'career');
                })
                ->select(
                    'players.id',
                    'players.ign',
                    'players.name',
                    'players.is_igl',
                    'players.current_role',
                    'players.photo_url',
                    'players.avg_acs',
                    'players.avg_kd',
                    'players.avg_adr',
                    'players.avg_fk',
                    'players.avg_fd',
                    'players.avg_rating',
                    'teams.name as team_name',
                    'teams.region as team_region',
                    'player_smart_results.final_score as smart_final_score'
                );

            if (!empty($q)) {
                $leetspeakMap = ['0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't'];
                $normalizedQ = str_replace(array_keys($leetspeakMap), array_values($leetspeakMap), strtolower($q));

                $query->where(function($qBuilder) use ($q, $normalizedQ) {
                    $qBuilder->where('players.ign', 'ilike', '%' . $q . '%')
                             ->orWhere('players.name', 'ilike', '%' . $q . '%')
                             ->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(players.ign), '0', 'o'), '1', 'i'), '3', 'e'), '4', 'a'), '5', 's'), '7', 't') LIKE ?", ['%' . $normalizedQ . '%']);
                });
            }

            if ($role !== 'All') {
                $query->where('players.current_role', $role);
            }

            switch ($sortBy) {
                case 'acs':
                    $query->orderBy('players.avg_acs', $sortDir);
                    break;
                case 'kd':
                    $query->orderBy('players.avg_kd', $sortDir);
                    break;
                case 'adr':
                    $query->orderBy('players.avg_adr', $sortDir);
                    break;
                case 'fkfd':
                    $query->orderByRaw('(players.avg_fk - players.avg_fd) ' . $sortDir);
                    break;
                case 'smart':
                default:
                    $query->orderBy('player_smart_results.final_score', $sortDir)
                          ->orderBy('players.ign', 'asc');
                    break;
            }

            $paginated = $query->paginate($limit);

            // Transform raw objects to nested structure expected by frontend
            $paginated->getCollection()->transform(function ($result) {
                return [
                    'id' => $result->id,
                    'ign' => $result->ign,
                    'name' => $result->name,
                    'is_igl' => (bool) $result->is_igl,
                    'current_role' => $result->current_role,
                    'photo_url' => $result->photo_url,
                    'avg_acs' => $result->avg_acs,
                    'avg_kd' => $result->avg_kd,
                    'avg_adr' => $result->avg_adr,
                    'avg_fk' => $result->avg_fk,
                    'avg_fd' => $result->avg_fd,
                    'avg_rating' => $result->avg_rating,
                    'team' => [
                        'name' => $result->team_name,
                        'region' => $result->team_region
                    ],
                    'smart_results' => [
                        [
                            'mode' => 'career',
                            'final_score' => $result->smart_final_score
                        ]
                    ]
                ];
            });

            return $paginated->toArray();
        });

        return response()->json($paginatorArray);
    }

    public function show($id)
    {
        $cacheKey = 'api_player_profile_' . $id;

        $playerData = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function() use ($id) {
            $player = Player::with([
                'team',
                'smartResults' => function ($q) { $q->where('mode', 'career'); }
            ])->findOrFail($id);

            $smartScore = $player->smartResults->first()?->final_score;
            
            $agents = \Illuminate\Support\Facades\DB::table('player_match_agents')
                ->where('player_id', $id)
                ->select('agent_name', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                ->groupBy('agent_name')
                ->orderBy('count', 'desc')
                ->get();
                
            $totalMatches = $player->total_matches > 0 ? $player->total_matches : 1;

            $mostPickedAgents = $agents->map(function($a) use ($totalMatches) {
                $agentDef = \Illuminate\Support\Facades\DB::table('valorant_agents')
                    ->whereRaw("REPLACE(name, '/', '') ILIKE ?", [str_replace('/', '', $a->agent_name)])
                    ->first();
                return [
                    'name' => $a->agent_name,
                    'count' => $a->count,
                    'percentage' => round(($a->count / $totalMatches) * 100, 1) . '%',
                    'icon_url' => $agentDef ? $agentDef->icon_url : null
                ];
            })->values()->toArray();

            $history = \Illuminate\Support\Facades\DB::table('player_smart_rank_history')
                ->where('player_id', $id)
                ->where('mode', 'career')
                ->orderBy('snapshot_date', 'asc')
                ->get();
                
            $rankHistory = $history->map(function($h) {
                return [
                    'date' => date('Y-m-d', strtotime($h->snapshot_date)),
                    'rank' => $h->rank
                ];
            })->values()->toArray();

            // Calculate current rank shift based on history
            $rankShift = '0';
            if (count($rankHistory) >= 2) {
                $last = $rankHistory[count($rankHistory) - 1]['rank'];
                $prev = $rankHistory[count($rankHistory) - 2]['rank'];
                $diff = $prev - $last; // if prev was 5 and last is 2, diff is +3
                if ($diff > 0) $rankShift = '+' . $diff;
                else if ($diff < 0) $rankShift = (string)$diff;
            }

            $radarStats = [
                'ACS' => round(min(100, max(0, ($player->avg_acs / 300) * 100))),
                'K/D' => round(min(100, max(0, ($player->avg_kd / 2.0) * 100))),
                'KAST' => round($player->avg_kast),
                'ADR' => round(min(100, max(0, ($player->avg_adr / 200) * 100))),
                'Adaptability' => round($player->meta_adaptability_index ?? 50),
                'Flexibility' => round($player->flexibility_score ?? 50),
            ];

            return [
                'id' => $player->id,
                'ign' => $player->ign,
                'name' => $player->name,
                'country' => $player->country,
                'team_name' => $player->team ? $player->team->name : 'F/A',
                'team_logo' => $player->team ? $player->team->logo_url : null,
                'photo_url' => $player->photo_url,
                'role' => $player->current_role,
                'smart_score' => $smartScore ? round($smartScore, 1) : null,
                'smart_rank' => count($rankHistory) > 0 ? $rankHistory[count($rankHistory) - 1]['rank'] : null,
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
                'radar_stats' => $radarStats,
                'most_picked_agents' => $mostPickedAgents
            ];
        });
        
        return response()->json($playerData);
    }
}