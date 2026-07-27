<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SmartCriteria;
use App\Models\SmartWeightProfile;
use App\Models\Player;
use App\Models\PlayerCriteriaScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SmartEngineController extends Controller
{
    public function criteria()
    {
        return response()->json(SmartCriteria::all());
    }

    public function profiles(Request $request)
    {
        $userId = $request->header('X-User-Id') ?? \App\Models\User::first()->id ?? null;
        if (!$userId) return response()->json(['error' => 'No user found'], 400);
        
        $profiles = SmartWeightProfile::with(['weightValues.criteria', 'queryFilters.criteria'])
            ->where('user_id', $userId)
            ->get();
            
        return response()->json($profiles);
    }

    public function storeProfile(Request $request)
    {
        $userId = $request->header('X-User-Id') ?? \App\Models\User::first()->id ?? null;
        if (!$userId) return response()->json(['error' => 'No user found'], 400);
        
        DB::beginTransaction();
        try {
            $profile = SmartWeightProfile::create([
                'user_id' => $userId,
                'name' => $request->name,
                'is_public' => $request->is_public ?? false,
            ]);
            
            if ($request->has('weights')) {
                foreach ($request->weights as $weight) {
                    $profile->weightValues()->create([
                        'criteria_id' => $weight['criteria_id'],
                        'rank_position' => $weight['rank_position'],
                        'computed_weight' => $weight['computed_weight'],
                    ]);
                }
            }
            
            if ($request->has('filters')) {
                foreach ($request->filters as $filter) {
                    $profile->queryFilters()->create([
                        'criteria_id' => $filter['criteria_id'],
                        'operator' => $filter['operator'],
                        'value' => $filter['value'],
                    ]);
                }
            }
            DB::commit();
            
            return response()->json($profile->load(['weightValues', 'queryFilters']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function calculate(Request $request)
    {
        $weights = collect($request->weights);
        $criteriaIds = $weights->pluck('criteria_id')->toArray();
        
        $players = Player::with(['team', 'criteriaScores' => function($q) use ($criteriaIds) {
            $q->whereIn('criteria_id', $criteriaIds);
        }])->get();
        
        $minMax = [];
        foreach ($criteriaIds as $cId) {
            $scores = $players->flatMap->criteriaScores->where('criteria_id', $cId)->pluck('raw_value');
            if ($scores->isNotEmpty()) {
                $minMax[$cId] = [
                    'min' => $scores->min(),
                    'max' => $scores->max()
                ];
            }
        }
        
        $results = $players->map(function($player) use ($weights, $minMax) {
            $score = 0;
            foreach ($weights as $w) {
                $cId = $w['criteria_id'];
                $ps = $player->criteriaScores->where('criteria_id', $cId)->first();
                if ($ps && isset($minMax[$cId])) {
                    $min = $minMax[$cId]['min'];
                    $max = $minMax[$cId]['max'];
                    $norm = ($max - $min) > 0 ? ($ps->raw_value - $min) / ($max - $min) : 0;
                    $score += ($norm * $w['weight']);
                }
            }
            $player->selection_score = $score;
            return $player;
        })->sortByDesc('selection_score')->values();

        return response()->json($results);
    }
}