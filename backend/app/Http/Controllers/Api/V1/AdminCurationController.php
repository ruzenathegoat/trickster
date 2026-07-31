<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AgentPatchRating;
use App\Models\AgentMapRating;
use App\Models\StageLabelMapping;
use Illuminate\Support\Facades\DB;

class AdminCurationController extends Controller
{
    private function getCacheKey($name) {
        $version = \Illuminate\Support\Facades\Cache::get('api_admin_cache_version', 1);
        return $name . '_v' . $version;
    }

    private function invalidateCache() {
        \Illuminate\Support\Facades\Cache::put('api_admin_cache_version', microtime(true));
    }

    public function storePatchRating(Request $request)
    {
        $validated = $request->validate([
'patch_version' => 'required|string',
            'agent' => 'required|string',
            'role' => 'required|string',
            'tier' => 'required|string|in:S,A,B,C,D',
            'direction' => 'required|string|in:buffed,nerfed,unchanged,reworked',
            'notes' => 'nullable|string'
        ]);

        $patch = \App\Models\Patch::firstOrCreate(['version' => $validated['patch_version']]);

        $rating = AgentPatchRating::create([
            'patch_id' => $patch->id,
            'agent' => $validated['agent'],
            'role' => $validated['role'],
            'tier' => $validated['tier'],
            'direction' => $validated['direction'],
            'notes' => $validated['notes'] ?? null,
        ]);
        return response()->json($rating, 201);
    }

    public function storeMapRating(Request $request)
    {
        $validated = $request->validate([
'patch_version' => 'required|string',
            'agent' => 'required|string',
            'map' => 'required|string',
            'score' => 'required|numeric|min:1|max:10',
            'effective_date' => 'nullable|date',
            'source_reference' => 'nullable|string',
            'confidence_level' => 'nullable|string|in:early_speculative,confirmed_by_tournament'
        ]);

        $patch = \App\Models\Patch::firstOrCreate(['version' => $validated['patch_version']]);

        $rating = AgentMapRating::create([
            'patch_id' => $patch->id,
            'agent' => $validated['agent'],
            'map' => $validated['map'],
            'score' => $validated['score'],
            'effective_date' => $validated['effective_date'] ?? null,
            'source_reference' => $validated['source_reference'] ?? null,
            'confidence_level' => $validated['confidence_level'] ?? null,
        ]);
        return response()->json($rating, 201);
    }

    public function supersedeMapRating(Request $request, $id)
    {
        $oldRating = AgentMapRating::findOrFail($id);
        
        $validated = $request->validate([
            'score' => 'required|numeric|min:1|max:10',
            'effective_date' => 'nullable|date',
            'source_reference' => 'nullable|string',
            'confidence_level' => 'nullable|string|in:early_speculative,confirmed_by_tournament'
        ]);
        
        DB::beginTransaction();
        try {
            // Create the new rating preserving patch, agent, map
            $newRating = AgentMapRating::create([
                'patch_id' => $oldRating->patch_id,
                'agent' => $oldRating->agent,
                'map' => $oldRating->map,
                'score' => $validated['score'],
                'effective_date' => $validated['effective_date'] ?? $oldRating->effective_date,
                'source_reference' => $validated['source_reference'] ?? $oldRating->source_reference,
                'confidence_level' => $validated['confidence_level'] ?? $oldRating->confidence_level,
            ]);
            
            // Mark the old one as superseded
            $oldRating->update(['superseded_by_id' => $newRating->id]);
            
            DB::commit();
            $this->invalidateCache();
            return response()->json($newRating, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function storeStageMapping(Request $request)
    {
        $validated = $request->validate([
            'raw_label' => 'required|string|unique:stage_label_mapping,raw_label',
            'normalized_stage' => 'required|string|in:regular_season,playoffs,grand_final',
            'pressure_weight' => 'required|numeric'
        ]);
        
        $mapping = StageLabelMapping::create($validated);
        $this->invalidateCache();
        return response()->json($mapping, 201);
    }

    public function getStageMappings()
    {
        return response()->json(\Illuminate\Support\Facades\Cache::remember($this->getCacheKey('stage_mappings'), 3600, fn() => StageLabelMapping::all()->toArray()));
    }

    public function getPatchRatings()
    {
        return response()->json(\Illuminate\Support\Facades\Cache::remember($this->getCacheKey('patch_ratings'), 3600, fn() => 
            AgentPatchRating::with('patch')
                ->join('patches', 'agent_patch_ratings.patch_id', '=', 'patches.id')
                ->orderBy('patches.release_date', 'desc')
                ->select('agent_patch_ratings.*')
                ->get()->toArray()
        ));
    }

    public function getMapRatings()
    {
        return response()->json(\Illuminate\Support\Facades\Cache::remember($this->getCacheKey('map_ratings'), 3600, fn() => 
            AgentMapRating::with('patch')
                ->join('patches', 'agent_map_ratings.patch_id', '=', 'patches.id')
                ->orderBy('patches.release_date', 'desc')
                ->select('agent_map_ratings.*')
                ->get()->toArray()
        ));
    }

    public function getPatches()
    {
        return response()->json(\Illuminate\Support\Facades\Cache::remember($this->getCacheKey('patches'), 3600, fn() => \App\Models\Patch::orderBy('release_date', 'desc')->get()->toArray()));
    }

    public function getAgents()
    {
        $agents = \Illuminate\Support\Facades\Cache::remember($this->getCacheKey('agents'), 3600, fn() => 
            DB::table('valorant_agents')
                ->select('name as agent', 'role as primary_role', 'icon_url')
                ->orderBy('name')
                ->get()->toArray()
        );
        return response()->json($agents);
    }

    public function getEvents()
    {
        $events = \Illuminate\Support\Facades\Cache::remember($this->getCacheKey('events'), 3600, fn() => 
            DB::table('events')
                ->select('id', 'name')
                ->orderByDesc('start_date')
                ->get()->toArray()
        );
        return response()->json($events);
    }

    public function getValorantMaps()
    {
        $maps = \Illuminate\Support\Facades\Cache::remember($this->getCacheKey('maps'), 3600, fn() => \App\Models\ValorantMap::orderBy('name')->get()->toArray());
        return response()->json($maps);
    }

    public function storeBulkPatchRatings(Request $request)
    {
        $validated = $request->validate([
            'patch_version' => 'required|string',
            'ratings' => 'required|array',
            'ratings.*.agent' => 'required|string',
            'ratings.*.role' => 'required|string',
            'ratings.*.tier' => 'required|string|in:S,A,B,C,D',
            'ratings.*.direction' => 'required|string|in:buffed,nerfed,unchanged,reworked',
            'ratings.*.notes' => 'nullable|string'
        ]);

        $patch = \App\Models\Patch::firstOrCreate(['version' => $validated['patch_version']]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $existingRatings = \App\Models\AgentPatchRating::where('patch_id', $patch->id)
                ->get()
                ->keyBy('agent');
                
            $inserts = [];
            foreach ($validated['ratings'] as $ratingData) {
                if (isset($existingRatings[$ratingData['agent']])) {
                    $existingRatings[$ratingData['agent']]->update([
                        'role' => $ratingData['role'],
                        'tier' => $ratingData['tier'],
                        'direction' => $ratingData['direction'],
                        'notes' => $ratingData['notes'] ?? null,
                    ]);
                } else {
                    $inserts[] = [
                        'patch_id' => $patch->id,
                        'agent' => $ratingData['agent'],
                        'role' => $ratingData['role'],
                        'tier' => $ratingData['tier'],
                        'direction' => $ratingData['direction'],
                        'notes' => $ratingData['notes'] ?? null,
                    ];
                }
            }
            
            if (!empty($inserts)) {
                \App\Models\AgentPatchRating::insert($inserts);
            }
            
            \Illuminate\Support\Facades\DB::commit();
            $this->invalidateCache();
            
            return response()->json(['message' => 'Bulk patch ratings saved successfully.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function storeBulkMapRatings(Request $request)
    {
        $validated = $request->validate([
            'patch_version'    => 'required|string',
            'ratings'          => 'required|array',
            'ratings.*'        => 'array',
            'ratings.*.*.score'             => 'required|numeric|min:1|max:10',
            'ratings.*.*.confidence_level'  => 'nullable|string|in:early_speculative,confirmed_by_tournament',
            'ratings.*.*.source_reference'  => 'nullable|string',
        ]);

        $patch = \App\Models\Patch::firstOrCreate(['version' => $validated['patch_version']]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $existingCollection = \App\Models\AgentMapRating::where('patch_id', $patch->id)
                ->whereNull('superseded_by_id')
                ->get();
            
            $existingMap = [];
            foreach ($existingCollection as $item) {
                $existingMap[$item->map][$item->agent] = $item;
            }
            
            $inserts = [];
            foreach ($validated['ratings'] as $mapName => $agentRatings) {
                foreach ($agentRatings as $agentName => $data) {
                    if (isset($existingMap[$mapName][$agentName])) {
                        $existingMap[$mapName][$agentName]->update([
                            'score' => $data['score'],
                            'confidence_level' => $data['confidence_level'] ?? null,
                            'source_reference' => $data['source_reference'] ?? null,
                        ]);
                    } else {
                        $inserts[] = [
                            'patch_id' => $patch->id,
                            'agent' => $agentName,
                            'map' => $mapName,
                            'score' => $data['score'],
                            'confidence_level' => $data['confidence_level'] ?? null,
                            'source_reference' => $data['source_reference'] ?? null,
                        ];
                    }
                }
            }
            
            if (!empty($inserts)) {
                \App\Models\AgentMapRating::insert($inserts);
            }
            
            \Illuminate\Support\Facades\DB::commit();
            $this->invalidateCache();
            
            return response()->json(['message' => 'Bulk map ratings saved successfully'], 200);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function autoCalculateMapRatings(Request $request)
    {
        $validated = $request->validate([
            'event_ids' => 'required|array',
            'patch_version' => 'required|string',
            'map_pool' => 'required|array',
        ]);

        $eventIds = $validated['event_ids'];
        $mapPool = $validated['map_pool'];
        
        $snapshots = \Illuminate\Support\Facades\DB::table('agent_pick_rate_snapshots')
            ->whereIn('event_id', $eventIds)
            ->whereNotNull('valorant_map_name')
            ->whereIn('valorant_map_name', $mapPool)
            ->get();
            
        if ($snapshots->isEmpty()) {
            return response()->json(['error' => 'No pick rate data found for the selected events'], 404);
        }
        
        $stats = [];
        foreach ($snapshots as $snap) {
            $map = $snap->valorant_map_name;
            // Handle naming inconsistencies via role map if necessary, but agent pick rates use standard names.
            $agent = ucfirst(strtolower($snap->agent_name));
            
            if (!isset($stats[$map])) {
                $stats[$map] = [];
            }
            if (!isset($stats[$map][$agent])) {
                $stats[$map][$agent] = [
                    'total_matches' => 0,
                    'total_picks' => 0,
                ];
            }
            
            $stats[$map][$agent]['total_matches'] += $snap->total_matches;
            $stats[$map][$agent]['total_picks'] += $snap->total_picks;
        }
        
        $ratings = [];
        foreach ($stats as $map => $agentStats) {
            $ratings[$map] = [];
            foreach ($agentStats as $agent => $data) {
                if ($data['total_matches'] == 0) continue;
                
                $pickRate = ($data['total_picks'] / $data['total_matches']) * 100;
                
                $score = 5;
                if ($pickRate > 50) $score = 10;
                else if ($pickRate > 30) $score = 8;
                else if ($pickRate > 15) $score = 6;
                else if ($pickRate > 5) $score = 4;
                else $score = 2;

                $ratings[$map][$agent] = [
                    'score' => $score,
                    'confidence_level' => 'confirmed_by_tournament',
                    'source_reference' => 'Auto-calculated from ' . count($eventIds) . ' events'
                ];
            }
        }
        
        return response()->json(['ratings' => $ratings]);
    }

    public function getMapRatingsByPatch($patchId)
    {
        $ratings = \App\Models\AgentMapRating::where('patch_id', $patchId)
            ->whereNull('superseded_by_id')
            ->get();
            
        $formatted = [];
        foreach ($ratings as $r) {
            if (!isset($formatted[$r->map])) {
                $formatted[$r->map] = [];
            }
            $formatted[$r->map][$r->agent] = [
                'score' => $r->score,
                'confidence_level' => $r->confidence_level,
                'source_reference' => $r->source_reference
            ];
        }
        
        return response()->json($formatted);
    }

    public function getPatchMapPool($patchId)
    {
        $pool = \App\Models\PatchMapPool::where('patch_id', $patchId)->pluck('map_name');
        return response()->json($pool);
    }

    public function savePatchMapPool(Request $request)
    {
        $validated = $request->validate([
            'patch_version' => 'required|string',
            'maps' => 'required|array',
            'maps.*' => 'string'
        ]);

        $patch = \App\Models\Patch::firstOrCreate(['version' => $validated['patch_version']]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            \App\Models\PatchMapPool::where('patch_id', $patch->id)->delete();
            
            $inserts = [];
            foreach ($validated['maps'] as $map) {
                $inserts[] = [
                    'patch_id' => $patch->id,
                    'map_name' => $map,
                ];
            }
            if (!empty($inserts)) {
                \App\Models\PatchMapPool::insert($inserts);
            }
            
            \Illuminate\Support\Facades\DB::commit();
            $this->invalidateCache();
            return response()->json(['message' => 'Patch map pool saved successfully']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
