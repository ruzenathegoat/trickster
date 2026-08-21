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
        $version = \Illuminate\Support\Facades\Cache::get('api_smart_calc_version', 'v1');
        $data = \Illuminate\Support\Facades\Cache::remember('api_leaderboard_top_'.$version, 3600, function() {
            $topResults = \Illuminate\Support\Facades\DB::table('player_smart_results')
                ->join('players', 'players.id', '=', 'player_smart_results.player_id')
                ->leftJoin('teams', 'teams.id', '=', 'players.team_id')
                ->where('player_smart_results.mode', 'career')
                ->whereNull('player_smart_results.patch_id')
                ->where('player_smart_results.is_provisional', false)
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
        $version = \Illuminate\Support\Facades\Cache::get('api_smart_calc_version', 'v1');
        $cacheKey = 'api_leaderboard_players_'.$version.'_role_' . md5($role) . '_page_' . $page;

        $paginatorArray = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function() use ($role) {
            $query = \Illuminate\Support\Facades\DB::table('player_smart_results')
                ->join('players', 'players.id', '=', 'player_smart_results.player_id')
                ->leftJoin('teams', 'teams.id', '=', 'players.team_id')
                ->where('player_smart_results.mode', 'career')
                ->whereNull('player_smart_results.patch_id')
                ->where('player_smart_results.is_provisional', false)
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
    

    private function normalize($value, $min, $max)
    {
        if ($value <= $min) return 10; // floor at 10% so the chart doesn't look totally collapsed
        if ($value >= $max) return 100;
        return round((($value - $min) / ($max - $min)) * 90 + 10); // Scale between 10-100
    }
}
