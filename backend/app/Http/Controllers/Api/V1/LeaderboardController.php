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
        // Get the top 3 players globally across all SMART profiles (or we could filter by a specific profile if needed)
        $topResults = \App\Models\PlayerSmartResult::with(['player.team', 'profile'])
            ->orderBy('final_score', 'desc')
            ->take(3)
            ->get();

        $data = $topResults->map(function ($result, $index) {
            $player = $result->player;
            if (!$player) return null;
            
            return [
                'id' => $player->id,
                'rank' => $index + 1,
                'ign' => $player->ign,
                'team_name' => $player->team ? $player->team->name : 'Free Agent',
                'photo_url' => $player->photo_url,
                // We show the SMART score instead of raw rating
                'rating' => round($result->final_score, 1),
                'role' => $result->mode !== 'overall' ? ucfirst($result->mode) : ($player->current_role ?? 'Flex'),
                'acs' => round($player->avg_acs, 1),
                'kd' => round($player->avg_kd, 2)
            ];
        })->filter();

        return response()->json($data->values());
    }

    /**
     * Get paginated leaderboard players with optional role filter.
     */
    public function players(Request $request)
    {
        $query = \App\Models\PlayerSmartResult::with(['player.team', 'profile'])
            ->orderBy('final_score', 'desc');

        if ($request->has('role') && $request->role !== 'All') {
            $query->whereHas('player', function($q) use ($request) {
                $q->where('current_role', $request->role);
            });
        }

        $paginator = $query->paginate(10);

        // Transform collection but keep pagination structure
        $paginator->getCollection()->transform(function ($result) {
            $player = $result->player;
            if (!$player) return null;

            return [
                'id' => $player->id,
                'ign' => $player->ign,
                'team_name' => $player->team ? $player->team->name : 'Free Agent',
                'photo_url' => $player->photo_url,
                'rating' => round($result->final_score, 1),
                'role' => $player->current_role ?? 'Flex',
                'acs' => round($player->avg_acs, 1),
                'kd' => round($player->avg_kd, 2)
            ];
        });

        return response()->json($paginator);
    }

    /**
     * Get detailed player profile including radar chart stats.
     */
    public function show($id)
    {
        $player = Player::with('team')->findOrFail($id);

        // Calculate most picked agents safely handling case sensitivity
        $agentPicks = \Illuminate\Support\Facades\DB::table('player_match_agents')
            ->where('player_id', $player->id)
            ->select('agent_name', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('agent_name')
            ->orderBy('count', 'desc')
            ->get();
            
        $agentsMap = \Illuminate\Support\Facades\DB::table('valorant_agents')->get()->keyBy(function($item) {
            return strtolower($item->name);
        });

        $mostPickedAgents = [];
        $totalPicks = $agentPicks->sum('count');
        if ($totalPicks > 0) {
            foreach ($agentPicks as $pick) {
                $agentMeta = $agentsMap->get(strtolower($pick->agent_name));
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
        if ($smartResult) {
            $smartScore = round($smartResult->final_score, 1);
            $smartRank = \App\Models\PlayerSmartResult::where('mode', 'career')
                            ->where('final_score', '>', $smartResult->final_score)
                            ->count() + 1;
        }

        return response()->json([
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
        ]);
    }

    private function normalize($value, $min, $max)
    {
        if ($value <= $min) return 10; // floor at 10% so the chart doesn't look totally collapsed
        if ($value >= $max) return 100;
        return round((($value - $min) / ($max - $min)) * 90 + 10); // Scale between 10-100
    }
}
