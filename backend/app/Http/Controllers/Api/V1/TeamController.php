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
        $query = Team::withCount([
                'matchesAsTeamA',
                'matchesAsTeamB',
            ])
            ->addSelect(['*',
                DB::raw('(SELECT COUNT(*) FROM matches WHERE winner_team_id = teams.id) as wins'),
            ]);

        if ($request->filled('q')) {
            $query->where('name', 'ilike', '%' . $request->q . '%');
        }

        if ($request->filled('region') && $request->region !== 'All') {
            $query->where('region', $request->region);
        }

        $query->orderByDesc('win_rate_2026');

        $paginator = $query->paginate(15);

        $paginator->getCollection()->transform(function ($team) {
            $totalMatches = $team->matches_as_team_a_count + $team->matches_as_team_b_count;
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

        return response()->json($paginator);
    }

    public function top()
    {
        $teams = Team::withCount([
                'matchesAsTeamA',
                'matchesAsTeamB',
                'players',
            ])
            ->addSelect(['*',
                DB::raw('(SELECT COUNT(*) FROM matches WHERE winner_team_id = teams.id) as wins'),
            ])
            ->whereNotNull('win_rate_2026')
            ->orderByDesc('win_rate_2026')
            ->take(3)
            ->get();

        $data = $teams->map(function ($team, $index) {
            $totalMatches = $team->matches_as_team_a_count + $team->matches_as_team_b_count;
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
        });

        return response()->json($data);
    }

    public function show($id)
    {
        $team = Team::with([
            'players',
            'matchesAsTeamA.event',
            'matchesAsTeamB.event'
        ])->findOrFail($id);

        $allMatches = $team->matchesAsTeamA->concat($team->matchesAsTeamB);

        $totalWins = 0;
        $totalLosses = 0;
        $tournamentStats = [];

        foreach ($allMatches as $match) {
            $isWin = $match->winner_team_id === $team->id;
            
            if ($isWin) {
                $totalWins++;
            } else if ($match->winner_team_id !== null) { // Count as loss only if there is a winner
                $totalLosses++;
            } else {
                continue; // Skip draws or unresolved matches for W/L stats
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

        // Format for frontend charts
        $tournaments = [];
        foreach ($tournamentStats as $name => $stats) {
            $tournaments[] = [
                'name' => $name,
                'wins' => $stats['wins'],
                'losses' => $stats['losses'],
                'total' => $stats['total']
            ];
        }

        // Sort tournaments by total matches (descending) or by name
        usort($tournaments, function($a, $b) {
            return $b['total'] <=> $a['total'];
        });

        return response()->json([
            'id' => $team->id,
            'name' => $team->name,
            'region' => $team->region,
            'logo_url' => $team->logo_url,
            'win_rate' => $team->win_rate_2026,
            'players' => $team->players,
            'stats' => [
                'total_matches' => $totalWins + $totalLosses,
                'total_wins' => $totalWins,
                'total_losses' => $totalLosses,
                'tournaments' => $tournaments
            ]
        ]);
    }
}
