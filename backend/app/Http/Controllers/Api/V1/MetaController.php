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
        $patches = \Illuminate\Support\Facades\Cache::remember('api_meta_patches', 3600, function() {
            return Patch::orderBy('release_date', 'desc')->pluck('version')->toArray();
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
                    'agents' => $agents
                ];
            }

            return $result;
        });

        return response()->json($response);
    }
}
