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
        
        $validSortDirs = ['asc', 'desc'];
        if (!in_array($sortDir, $validSortDirs)) {
            $sortDir = 'desc';
        }

        $cacheKey = 'api_players_explorer_' . md5(json_encode(compact('page', 'q', 'role', 'sortBy', 'sortDir')));

        $paginatorArray = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function() use ($q, $role, $sortBy, $sortDir) {
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
                    'players.current_role',
                    'players.photo_url',
                    'players.avg_acs',
                    'players.avg_kd',
                    'players.avg_adr',
                    'players.avg_fk',
                    'players.avg_fd',
                    'teams.name as team_name',
                    'teams.region as team_region',
                    'player_smart_results.final_score as smart_final_score'
                );

            if (!empty($q)) {
                $query->where(function($qBuilder) use ($q) {
                    $qBuilder->where('players.ign', 'ilike', '%' . $q . '%')
                             ->orWhere('players.name', 'ilike', '%' . $q . '%');
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

            $paginated = $query->paginate(20);

            // Transform raw objects to nested structure expected by frontend
            $paginated->getCollection()->transform(function ($result) {
                return [
                    'id' => $result->id,
                    'ign' => $result->ign,
                    'name' => $result->name,
                    'current_role' => $result->current_role,
                    'photo_url' => $result->photo_url,
                    'avg_acs' => $result->avg_acs,
                    'avg_kd' => $result->avg_kd,
                    'avg_adr' => $result->avg_adr,
                    'avg_fk' => $result->avg_fk,
                    'avg_fd' => $result->avg_fd,
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
        $player = Player::with([
            'team',
            'mapStats.map',
            'criteriaScores.criteria',
            'smartResults' => function ($q) { $q->where('mode', 'career'); }
        ])->findOrFail($id);
        
        return response()->json($player);
    }
}