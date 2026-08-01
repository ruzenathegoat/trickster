<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\MatchData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->get('q', '');
        $region = $request->get('region', 'All');
        $page = $request->get('page', 1);

        $cacheKey = 'api_teams_explorer_' . md5(json_encode(compact('q', 'region', 'page')));

        $paginatorArray = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function() use ($q, $region) {
            $query = Team::withCount([
                    'matchesAsTeamA as resolved_a' => function($query) { $query->whereNotNull('winner_team_id'); },
                    'matchesAsTeamB as resolved_b' => function($query) { $query->whereNotNull('winner_team_id'); },
                ])
                ->addSelect(['*',
                    DB::raw('(SELECT COUNT(*) FROM matches WHERE winner_team_id = teams.id) as wins'),
                ]);

            if (!empty($q)) {
                $leetspeakMap = ['0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't'];
                $normalizedQ = str_replace(array_keys($leetspeakMap), array_values($leetspeakMap), strtolower($q));

                $query->where(function($qBuilder) use ($q, $normalizedQ) {
                    $qBuilder->where('name', 'ilike', '%' . $q . '%')
                             ->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(name), '0', 'o'), '1', 'i'), '3', 'e'), '4', 'a'), '5', 's'), '7', 't') LIKE ?", ['%' . $normalizedQ . '%']);
                });
            }

            if ($region !== 'All') {
                $query->where('region', $region);
            }

            $query->orderByRaw('win_rate_2026 DESC NULLS LAST');

            $paginator = $query->paginate(15);

            $paginator->getCollection()->transform(function ($team) {
                $totalMatches = $team->resolved_a + $team->resolved_b;
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'region' => $team->region ?? 'Unknown',
                    'logo_url' => $team->logo_url,
                    'win_rate' => $team->win_rate_2026 ? round($team->win_rate_2026, 1) : null,
                    'total_matches' => $totalMatches,
                    'wins' => (int) $team->wins,
                    'losses' => $totalMatches - (int) $team->wins,
                    'player_count' => $team->players_count ?? null,
                ];
            });

            return $paginator->toArray();
        });

        return response()->json($paginatorArray);
    }

    public function top()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('api_teams_top', 3600, function() {
            $teams = Team::withCount([
                    'matchesAsTeamA as resolved_a' => function($q) { $q->whereNotNull('winner_team_id'); },
                    'matchesAsTeamB as resolved_b' => function($q) { $q->whereNotNull('winner_team_id'); },
                    'players',
                ])
                ->addSelect(['*',
                    DB::raw('(SELECT COUNT(*) FROM matches WHERE winner_team_id = teams.id) as wins'),
                ])
                ->whereNotNull('win_rate_2026')
                ->orderByDesc('win_rate_2026')
                ->take(3)
                ->get();

            return $teams->map(function ($team, $index) {
                $totalMatches = $team->resolved_a + $team->resolved_b;
                return [
                    'id' => $team->id,
                    'rank' => $index + 1,
                    'name' => $team->name,
                    'region' => $team->region ?? 'Unknown',
                    'logo_url' => $team->logo_url,
                    'win_rate' => round($team->win_rate_2026, 1),
                    'total_matches' => $totalMatches,
                    'wins' => (int) $team->wins,
                    'losses' => $totalMatches - (int) $team->wins,
                    'player_count' => $team->players_count,
                ];
            })->toArray();
        });

        return response()->json($data);
    }

    public function show($id)
    {
        $data = \Illuminate\Support\Facades\Cache::remember('api_team_profile_' . $id, 3600, function() use ($id) {
            $team = Team::with([
                'players',
                'matchesAsTeamA.event',
                'matchesAsTeamB.event',
                'matchesAsTeamA.maps',
                'matchesAsTeamB.maps'
            ])->findOrFail($id);

            $allMatches = $team->matchesAsTeamA->concat($team->matchesAsTeamB);

            $totalWins = 0;
            $totalLosses = 0;
            $tournamentStats = [];

            foreach ($allMatches as $match) {
                $isWin = $match->winner_team_id === $team->id;
                
                if ($isWin) {
                    $totalWins++;
                } else if ($match->winner_team_id !== null) {
                    $totalLosses++;
                } else {
                    continue; 
                }

                $eventName = $match->event ? $match->event->name : 'Unknown Event';
                
                if (!isset($tournamentStats[$eventName])) {
                    $tournamentStats[$eventName] = ['wins' => 0, 'losses' => 0, 'total' => 0];
                }

                $tournamentStats[$eventName]['total']++;
                if ($isWin) {
                    $tournamentStats[$eventName]['wins']++;
                } else {
                    $tournamentStats[$eventName]['losses']++;
                }
            }

            $tournaments = [];
            foreach ($tournamentStats as $name => $stats) {
                $tournaments[] = [
                    'name' => $name,
                    'wins' => $stats['wins'],
                    'losses' => $stats['losses'],
                    'total' => $stats['total']
                ];
            }

            usort($tournaments, function($a, $b) {
                return $b['total'] <=> $a['total'];
            });

            $valorantMaps = \App\Models\ValorantMap::all()->keyBy('name');
            $mapStats = [];
            $totalMapsPlayed = 0;

            foreach ($allMatches as $match) {
                foreach ($match->maps as $map) {
                    if (!$map->valorant_map_name || strtoupper($map->valorant_map_name) === 'TBD') continue;
                    $mapName = $map->valorant_map_name;
                    
                    if (!isset($mapStats[$mapName])) {
                        $mapStats[$mapName] = ['picks' => 0, 'wins' => 0];
                    }
                    
                    $mapStats[$mapName]['picks']++;
                    $totalMapsPlayed++;
                    
                    if ($map->winner_team_id === $team->id) {
                        $mapStats[$mapName]['wins']++;
                    }
                }
            }
            
            $mostPickedMaps = [];
            foreach ($mapStats as $mapName => $stats) {
                $vMap = $valorantMaps->get($mapName);
                $mostPickedMaps[] = [
                    'name' => $mapName,
                    'count' => $stats['picks'],
                    'win_rate' => $stats['picks'] > 0 ? round(($stats['wins'] / $stats['picks']) * 100, 1) : 0,
                    'percentage' => $totalMapsPlayed > 0 ? round(($stats['picks'] / $totalMapsPlayed) * 100, 1) . '%' : '0%',
                    'icon_url' => $vMap ? $vMap->list_view_icon : null,
                    'splash_url' => $vMap ? $vMap->splash_url : null,
                ];
            }

            usort($mostPickedMaps, function($a, $b) {
                return $b['count'] <=> $a['count'];
            });

            $recentMatches = \App\Models\MatchData::with(['teamA', 'teamB', 'event'])
                ->where(function($q) use ($id) {
                    $q->where('team_a_id', $id)
                      ->orWhere('team_b_id', $id);
                })
                ->whereNotNull('winner_team_id')
                ->orderBy('match_date', 'desc')
                ->take(3)
                ->get()
                ->map(function($m) use ($team) {
                    $isTeamA = $m->team_a_id === $team->id;
                    $opponent = $isTeamA ? $m->teamB : $m->teamA;
                    $isWin = $m->winner_team_id === $team->id;
                    
                    return [
                        'id' => $m->id,
                        'date' => $m->match_date,
                        'opponent_name' => $opponent ? $opponent->name : 'Unknown',
                        'opponent_logo' => $opponent ? $opponent->logo_url : null,
                        'opponent_id' => $opponent ? $opponent->id : null,
                        'event_name' => $m->event ? $m->event->name : 'Unknown Event',
                        'is_win' => $isWin,
                    ];
                })->toArray();

            return [
                'id' => $team->id,
                'name' => $team->name,
                'region' => $team->region,
                'logo_url' => $team->logo_url,
                'win_rate' => $team->win_rate_2026,
                'players' => $team->players->toArray(),
                'stats' => [
                    'total_matches' => $totalWins + $totalLosses,
                    'total_wins' => $totalWins,
                    'total_losses' => $totalLosses,
                    'tournaments' => $tournaments
                ],
                'most_picked_maps' => $mostPickedMaps,
                'recent_matches' => $recentMatches
            ];
        });

        return response()->json($data);
    }
}
