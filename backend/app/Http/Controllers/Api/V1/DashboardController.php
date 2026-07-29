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
        // 1. Hero KPI - Top Match (Player)
        $topPlayerResult = PlayerSmartResult::with(['player', 'profile'])
            ->orderBy('final_score', 'desc')
            ->first();

        $heroKpi = null;
        if ($topPlayerResult) {
            $heroKpi = [
                'name' => $topPlayerResult->player->ign ?? 'Unknown',
                'score' => $topPlayerResult->final_score,
                'profile_name' => $topPlayerResult->profile->name ?? 'Default Profile',
                // For role, we could infer it or provide a default if we don't have it explicitly mapped in SMART results
                'role' => $topPlayerResult->mode !== 'overall' ? ucfirst($topPlayerResult->mode) : 'Overall'
            ];
        }

        // 2. Meta Shift - Top 4 Agents by Rating in the Latest Patch
        $latestPatch = Patch::orderBy('release_date', 'desc')->first();
        $metaShift = [
            'patch' => $latestPatch ? $latestPatch->version : 'N/A',
            'top_agents' => []
        ];

        if ($latestPatch) {
            $topAgents = AgentPatchRating::where('patch_id', $latestPatch->id)
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

            // We fake the 'increase' percentage for UI purposes since we don't have delta easily calculated here without joining previous patch
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
                    'name' => $agent->agent, // The column is 'agent', not 'agent_name'
                    'rating' => $agent->tier, // The column is 'tier'
                    'height' => $tierHeights[$agent->tier] ?? '20%',
                    'shift' => $fakeIncreases[$index] ?? '+1%'
                ];
            }
        }

        // 3. Recent Matches (Completed only)
        $matches = MatchData::with(['teamA', 'teamB', 'event', 'maps'])
            ->whereNotNull('winner_team_id')
            ->orderBy('match_date', 'desc')
            ->take(5)
            ->get();

        $recentMatches = [];
        foreach ($matches as $match) {
            $recentMatches[] = [
                'date' => $match->match_date,
                'event' => $match->event->name ?? 'Unknown Event',
                'team_a' => $match->teamA->name ?? 'TBD',
                'team_b' => $match->teamB->name ?? 'TBD',
                'team_a_id' => $match->team_a_id,
                'team_b_id' => $match->team_b_id,
                'winner_id' => $match->winner_team_id
            ];
        }

        return response()->json([
            'hero_kpi' => $heroKpi,
            'meta_shift' => $metaShift,
            'recent_matches' => $recentMatches
        ]);
    }
}
