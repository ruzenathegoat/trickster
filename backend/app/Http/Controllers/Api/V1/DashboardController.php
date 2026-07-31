<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PlayerSmartResult;
use App\Models\AgentPatchRating;
use App\Models\MatchData;
use App\Models\Patch;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get data for the user dashboard overview.
     */
    public function index()
    {
        $dashboardData = \Illuminate\Support\Facades\Cache::remember('api_dashboard', 3600, function() {
            // 1. Hero KPI - Top Match (Player) using JOIN
            $topPlayerResult = \Illuminate\Support\Facades\DB::table('player_smart_results')
                ->join('players', 'players.id', '=', 'player_smart_results.player_id')
                ->leftJoin('smart_weight_profiles', 'smart_weight_profiles.id', '=', 'player_smart_results.profile_id')
                ->select(
                    'player_smart_results.final_score',
                    'player_smart_results.mode',
                    'players.ign as ign',
                    'players.photo_url as photo_url',
                    'smart_weight_profiles.name as profile_name'
                )
                ->orderBy('player_smart_results.final_score', 'desc')
                ->first();

            $heroKpi = null;
            if ($topPlayerResult) {
                $heroKpi = [
                    'name' => $topPlayerResult->ign ?? 'Unknown',
                    'score' => $topPlayerResult->final_score,
                    'profile_name' => $topPlayerResult->profile_name ?? 'Default Profile',
                    'photo_url' => $topPlayerResult->photo_url ?? null,
                    'role' => $topPlayerResult->mode !== 'overall' ? ucfirst($topPlayerResult->mode) : 'Overall'
                ];
            }

            // 2. Meta Shift - Top 4 Agents by Rating in the Latest Patch
            $latestPatch = \Illuminate\Support\Facades\DB::table('patches')->orderBy('release_date', 'desc')->first();
            $metaShift = [
                'patch' => $latestPatch ? $latestPatch->version : 'N/A',
                'top_agents' => []
            ];

            if ($latestPatch) {
                $topAgents = \Illuminate\Support\Facades\DB::table('agent_patch_ratings')
                    ->where('patch_id', $latestPatch->id)
                    ->orderByRaw("
                        CASE tier 
                            WHEN 'S' THEN 1 
                            WHEN 'A' THEN 2 
                            WHEN 'B' THEN 3 
                            WHEN 'C' THEN 4 
                            WHEN 'D' THEN 5 
                            ELSE 6 
                        END ASC
                    ")
                    ->take(4)
                    ->get();

                $fakeIncreases = ['+12%', '+7%', '+4%', '+2%'];
                $tierHeights = [
                    'S' => '100%',
                    'A' => '85%',
                    'B' => '70%',
                    'C' => '50%',
                    'D' => '30%',
                ];
                
                foreach ($topAgents as $index => $agent) {
                    $metaShift['top_agents'][] = [
                        'name' => $agent->agent,
                        'rating' => $agent->tier,
                        'height' => $tierHeights[$agent->tier] ?? '20%',
                        'shift' => $fakeIncreases[$index] ?? '+1%'
                    ];
                }
            }

            // 3. Recent Matches (Completed only) using JOIN
            $matches = \Illuminate\Support\Facades\DB::table('matches')
                ->join('teams as teamA', 'teamA.id', '=', 'matches.team_a_id')
                ->join('teams as teamB', 'teamB.id', '=', 'matches.team_b_id')
                ->leftJoin('events', 'events.id', '=', 'matches.event_id')
                ->whereNotNull('matches.winner_team_id')
                ->orderBy('matches.match_date', 'desc')
                ->select(
                    'matches.match_date',
                    'matches.team_a_id',
                    'matches.team_b_id',
                    'matches.winner_team_id',
                    'teamA.name as team_a_name',
                    'teamA.logo_url as team_a_logo',
                    'teamB.name as team_b_name',
                    'teamB.logo_url as team_b_logo',
                    'events.name as event_name'
                )
                ->take(5)
                ->get();

            $recentMatches = [];
            foreach ($matches as $match) {
                $recentMatches[] = [
                    'date' => $match->match_date,
                    'event' => $match->event_name ?? 'Unknown Event',
                    'team_a' => $match->team_a_name ?? 'TBD',
                    'team_b' => $match->team_b_name ?? 'TBD',
                    'team_a_logo' => $match->team_a_logo ?? null,
                    'team_b_logo' => $match->team_b_logo ?? null,
                    'team_a_id' => $match->team_a_id,
                    'team_b_id' => $match->team_b_id,
                    'winner_id' => $match->winner_team_id
                ];
            }

            return [
                'hero_kpi' => $heroKpi,
                'meta_shift' => $metaShift,
                'recent_matches' => $recentMatches
            ];
        });

        return response()->json($dashboardData);
    }
}
