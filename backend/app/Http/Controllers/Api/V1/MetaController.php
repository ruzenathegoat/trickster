<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Patch;
use App\Models\AgentMapRating;
use App\Models\PatchMapPool;
use Illuminate\Support\Facades\DB;

class MetaController extends Controller
{
    public function getPatches()
    {
        // Get all patches that have map ratings or map pools and cache them
        $patches = \Illuminate\Support\Facades\Cache::remember('api_meta_patches_v2', 3600, function() {
            $patchesData = Patch::with('events')->orderBy('release_date', 'desc')->get();
            $result = [];
            foreach ($patchesData as $p) {
                $label = 'Patch ' . $p->version;
                if ($p->events->count() > 0) {
                    $hasKickoff = false; $hasStage1 = false; $hasStage2 = false; $hasChampions = false; $hasMasters = false;
                    $mastersName = '';
                    foreach ($p->events as $event) {
                        $low = strtolower($event->name);
                        if (str_contains($low, 'kickoff')) $hasKickoff = true;
                        if (str_contains($low, 'stage 1')) $hasStage1 = true;
                        if (str_contains($low, 'stage 2')) $hasStage2 = true;
                        if (str_contains($low, 'champions')) $hasChampions = true;
                        if (str_contains($low, 'masters')) {
                            $hasMasters = true;
                            // Extract just "Masters [City]" if possible, otherwise use the full name
                            if (preg_match('/masters\s+(\w+)/i', $event->name, $matches)) {
                                $mastersName = 'VCT Masters ' . ucfirst($matches[1]);
                            } else {
                                $mastersName = 'VCT Masters';
                            }
                        }
                    }
                    if ($hasChampions) $label = 'VCT Champions (Patch ' . $p->version . ')';
                    elseif ($hasMasters) $label = $mastersName . ' (Patch ' . $p->version . ')';
                    elseif ($hasStage2) $label = 'VCT Stage 2 (Patch ' . $p->version . ')';
                    elseif ($hasStage1) $label = 'VCT Stage 1 (Patch ' . $p->version . ')';
                    elseif ($hasKickoff) $label = 'VCT Kickoff (Patch ' . $p->version . ')';
                    else $label = $p->events->first()->name . ' (Patch ' . $p->version . ')';
                }
                
                $result[] = [
                    'version' => $p->version,
                    'label' => $label
                ];
            }
            return $result;
        });
        
        return response()->json($patches);
    }

    private function getTierFromScore($score)
    {
        if ($score >= 8) return 'S';
        if ($score >= 6) return 'A';
        if ($score >= 4) return 'B';
        if ($score >= 2) return 'C';
        return 'D';
    }

    private function getTierValue($tier)
    {
        switch ($tier) {
            case 'S': return 5;
            case 'A': return 4;
            case 'B': return 3;
            case 'C': return 2;
            case 'D': return 1;
            default: return 0;
        }
    }

    public function getMapMetaByPatch($patchVersion)
    {
        $currentPatch = Patch::where('version', $patchVersion)->first();
        if (!$currentPatch) {
            return response()->json(['error' => 'Patch not found'], 404);
        }

        $response = \Illuminate\Support\Facades\Cache::remember('api_meta_map_pool_' . $patchVersion, 3600, function() use ($currentPatch) {
            // Get the map pool for this patch
            $mapPoolNames = PatchMapPool::where('patch_id', $currentPatch->id)->pluck('map_name')->toArray();
            
            // If empty, fallback to all maps that have ratings in this patch
            if (empty($mapPoolNames)) {
                $mapPoolNames = AgentMapRating::where('patch_id', $currentPatch->id)
                    ->whereNull('superseded_by_id')
                    ->distinct()
                    ->pluck('map')
                    ->toArray();
            }

            // Get maps meta data
            $mapsMeta = DB::table('valorant_maps')
                ->whereIn('name', $mapPoolNames)
                ->get()
                ->keyBy('name');

            // Get agent meta data for icons
            $agentsMetaRaw = DB::table('valorant_agents')->get();
            $agentsMeta = [];
            foreach ($agentsMetaRaw as $agent) {
                $normalized = strtolower(preg_replace('/[^a-z0-9]/i', '', $agent->name));
                $agentsMeta[$normalized] = $agent;
            }

            // Find previous patch to calculate shifts
            $previousPatch = Patch::where('release_date', '<', $currentPatch->release_date)
                ->orderBy('release_date', 'desc')
                ->first();

            $prevRatingsData = [];
            if ($previousPatch) {
                $prevRatings = AgentMapRating::where('patch_id', $previousPatch->id)
                    ->whereNull('superseded_by_id')
                    ->get();
                foreach ($prevRatings as $r) {
                    $prevRatingsData[$r->map][$r->agent] = $this->getTierFromScore($r->score);
                }
            }

            // Get current patch ratings
            $currentRatings = AgentMapRating::where('patch_id', $currentPatch->id)
                ->whereNull('superseded_by_id')
                ->get();

            $mapRatings = [];
            foreach ($currentRatings as $r) {
                if (!in_array($r->map, $mapPoolNames)) continue;

                $tier = $this->getTierFromScore($r->score);
                
                // Only care about S and A for this UI
                if (!in_array($tier, ['S', 'A'])) continue;

                $shift = null;
                if (isset($prevRatingsData[$r->map][$r->agent])) {
                    $prevTier = $prevRatingsData[$r->map][$r->agent];
                    $diff = $this->getTierValue($tier) - $this->getTierValue($prevTier);
                    if ($diff > 0) {
                        $shift = '+' . $diff;
                    } elseif ($diff < 0) {
                        $shift = (string)$diff;
                    }
                }

                if (!isset($mapRatings[$r->map])) {
                    $mapRatings[$r->map] = [];
                }

                $normalizedAgentName = strtolower(preg_replace('/[^a-z0-9]/i', '', $r->agent));
                $icon = isset($agentsMeta[$normalizedAgentName]) ? $agentsMeta[$normalizedAgentName]->icon_url : null;
                $displayName = isset($agentsMeta[$normalizedAgentName]) ? $agentsMeta[$normalizedAgentName]->name : $r->agent;

                $mapRatings[$r->map][] = [
                    'name' => $displayName,
                    'icon' => $icon,
                    'tier' => $tier,
                    'shift' => $shift
                ];
            }

            // Determine event_ids for this patch
            $eventIds = $currentPatch->events()->pluck('events.id')->toArray();
            
            // If no events linked, fallback to doing nothing or using a dummy WHERE that allows all (or maybe filter by patch_id directly, but we know it's often null). We'll just allow all if empty for safety, or we could require it. Actually, if empty, we just query without event filter.
            $eventFilter = "";
            if (!empty($eventIds)) {
                $idsString = "'" . implode("','", $eventIds) . "'";
                $eventFilter = "WHERE m.event_id IN ($idsString)";
            }

            // Query Top 5 Compositions per Map from Match History
            $compositionsRaw = DB::select("
                WITH MatchTeams AS (
                    SELECT 
                        pma.match_id, 
                        p.team_id, 
                        maps.valorant_map_name as map_name,
                        m.winner_team_id
                    FROM player_match_agents pma
                    JOIN players p ON p.id = pma.player_id
                    JOIN matches m ON m.id = pma.match_id
                    JOIN maps ON maps.id = pma.map_id
                    $eventFilter
                    GROUP BY pma.match_id, p.team_id, maps.valorant_map_name, m.winner_team_id
                ),
                TeamAgents AS (
                    SELECT 
                        pma.match_id, 
                        p.team_id, 
                        maps.valorant_map_name as map_name,
                        STRING_AGG(pma.agent_name, ',' ORDER BY pma.agent_name ASC) as composition
                    FROM player_match_agents pma
                    JOIN players p ON p.id = pma.player_id
                    JOIN maps ON maps.id = pma.map_id
                    GROUP BY pma.match_id, p.team_id, maps.valorant_map_name
                    HAVING COUNT(pma.agent_name) = 5
                ),
                MatchComps AS (
                    SELECT 
                        mt.map_name,
                        ta.composition,
                        (CASE WHEN mt.winner_team_id = mt.team_id THEN 1 ELSE 0 END) as is_win
                    FROM MatchTeams mt
                    JOIN TeamAgents ta ON ta.match_id = mt.match_id AND ta.team_id = mt.team_id AND ta.map_name = mt.map_name
                )
                SELECT 
                    map_name, 
                    composition, 
                    COUNT(*) as total_picks, 
                    SUM(is_win) as total_wins
                FROM MatchComps
                GROUP BY map_name, composition
                HAVING COUNT(*) >= 1
                ORDER BY map_name, COUNT(*) DESC
            ");

            $compositionsByMap = [];
            foreach ($compositionsRaw as $c) {
                if (!isset($compositionsByMap[$c->map_name])) {
                    $compositionsByMap[$c->map_name] = [];
                }
                
                // Only take top 5 per map
                if (count($compositionsByMap[$c->map_name]) < 5) {
                    $agentNames = explode(',', $c->composition);
                    $compAgents = [];
                    foreach ($agentNames as $name) {
                        $normalizedName = strtolower(preg_replace('/[^a-z0-9]/i', '', $name));
                        $icon = isset($agentsMeta[$normalizedName]) ? $agentsMeta[$normalizedName]->icon_url : null;
                        $displayName = isset($agentsMeta[$normalizedName]) ? $agentsMeta[$normalizedName]->name : $name;
                        $compAgents[] = [
                            'name' => $displayName,
                            'icon' => $icon
                        ];
                    }

                    $winRate = $c->total_picks > 0 ? round(($c->total_wins / $c->total_picks) * 100, 1) : 0;

                    $compositionsByMap[$c->map_name][] = [
                        'agents' => $compAgents,
                        'total_matches' => $c->total_picks,
                        'win_rate' => $winRate
                    ];
                }
            }

            // Build the final response array matching the MOCK_MAP_META structure
            $result = [];
            foreach ($mapPoolNames as $mapName) {
                // Even if no S/A agents, include the map
                $image = isset($mapsMeta[$mapName]) ? $mapsMeta[$mapName]->splash_url : null;
                
                // Sort agents: S first, then A. Within tier, sort alphabetically.
                $agents = $mapRatings[$mapName] ?? [];
                usort($agents, function($a, $b) {
                    if ($a['tier'] !== $b['tier']) {
                        return $a['tier'] === 'S' ? -1 : 1;
                    }
                    return strcmp($a['name'], $b['name']);
                });

                $result[] = [
                    'id' => strtolower(str_replace(' ', '-', $mapName)),
                    'name' => $mapName,
                    'image' => $image,
                    'agents' => $agents,
                    'compositions' => $compositionsByMap[$mapName] ?? []
                ];
            }

            return $result;
        });

        return response()->json($response);
    }
}
