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
    public function storePatchRating(Request $request)
    {
        $validated = $request->validate([
            'patch_id' => 'required|uuid',
            'agent' => 'required|string',
            'role' => 'required|string',
            'tier' => 'required|string|in:S,A,B,C,D',
            'direction' => 'required|string|in:buffed,nerfed,unchanged,reworked',
            'notes' => 'nullable|string'
        ]);

        $rating = AgentPatchRating::create($validated);
        return response()->json($rating, 201);
    }

    public function storeMapRating(Request $request)
    {
        $validated = $request->validate([
            'patch_id' => 'required|uuid',
            'agent' => 'required|string',
            'map' => 'required|string',
            'score' => 'required|numeric|min:1|max:10',
            'effective_date' => 'nullable|date',
            'source_reference' => 'nullable|string',
            'confidence_level' => 'nullable|string|in:early_speculative,confirmed_by_tournament'
        ]);

        $rating = AgentMapRating::create($validated);
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
        return response()->json($mapping, 201);
    }

    public function getStageMappings()
    {
        return response()->json(StageLabelMapping::all());
    }

    public function getPatchRatings()
    {
        return response()->json(
            AgentPatchRating::with('patch')
                ->join('patches', 'agent_patch_ratings.patch_id', '=', 'patches.id')
                ->orderBy('patches.release_date', 'desc')
                ->select('agent_patch_ratings.*')
                ->get()
        );
    }

    public function getMapRatings()
    {
        return response()->json(
            AgentMapRating::with('patch')
                ->join('patches', 'agent_map_ratings.patch_id', '=', 'patches.id')
                ->orderBy('patches.release_date', 'desc')
                ->select('agent_map_ratings.*')
                ->get()
        );
    }

    public function getPatches()
    {
        return response()->json(\App\Models\Patch::orderBy('release_date', 'desc')->get());
    }

    public function getAgents()
    {
        // Get unique agents from the role map
        $agents = DB::table('agent_role_map')->select('agent', 'primary_role')->get();
        return response()->json($agents);
    }
}
