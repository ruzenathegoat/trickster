<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Models\PlayerSmartResult;
use App\Models\SmartCriteria;
use App\Models\SmartWeightProfile;
use App\Models\User;
use App\Services\ConsistencyIndexCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SmartEngineController extends Controller
{
    public function criteria()
    {
        return response()->json(Cache::remember('api_smart_criteria', 3600, function () {
            return SmartCriteria::all()->toArray();
        }));
    }

    public function bounds()
    {
        return response()->json(Cache::remember('api_smart_bounds', 3600, function () {
            $min = PlayerSmartResult::where('mode', 'career')->min('final_score') ?? 0;
            $max = PlayerSmartResult::where('mode', 'career')->max('final_score') ?? 100;

            return [
                'min' => round((float) $min, 1),
                'max' => round((float) $max, 1),
            ];
        }));
    }

    public function scout(Request $request)
    {
        $role = $request->input('role');
        $minScore = $request->input('min_score', 0);
        $playstyle = $request->input('playstyle', 'Adaptable');
        $preferredAgents = $request->input('agent_preferences', []);
        $mode = $request->input('mode', 'career');

        $version = Cache::get('api_smart_calc_version', 'v1');
        $cacheKey = 'scout_'.$version.'_'.md5(json_encode([$role, $minScore, $playstyle, $preferredAgents, $mode]));

        $finalResponse = Cache::remember($cacheKey, 3600, function () use ($role, $minScore, $playstyle, $preferredAgents, $mode) {
            $results = DB::table('player_smart_results')
                ->join('players', 'player_smart_results.player_id', '=', 'players.id')
                ->where('player_smart_results.mode', $mode)
                ->where('player_smart_results.final_score', '>=', $minScore)
                ->where('players.current_role', $role)
                ->select(
                    'player_smart_results.final_score',
                    'player_smart_results.is_provisional',
                    'player_smart_results.smart_confidence',
                    'players.id',
                    'players.ign',
                    'players.current_role',
                    'players.photo_url'
                )
                ->orderBy('player_smart_results.final_score', 'desc')
                ->get();

            $playerIds = $results->pluck('id')->toArray();

            // 1. BATCH QUERY: Database Level Grouping
            $allAgentPicks = DB::table('player_match_agents')
                ->whereIn('player_id', $playerIds)
                ->select('player_id', 'agent_name', DB::raw('count(*) as count'))
                ->groupBy('player_id', 'agent_name')
                ->get()
                ->groupBy('player_id');

            // 2. CACHE METADATA
            $agentsMap = Cache::rememberForever('valorant_agents_map_array', function () {
                $agents = DB::table('valorant_agents')->get();
                $map = [];
                foreach ($agents as $item) {
                    $key = preg_replace('/[^a-z0-9]/', '', strtolower($item->name));
                    $map[$key] = (array) $item;
                }

                return $map;
            });

            $finalResults = [];
            foreach ($results as $player) {
                $picks = $allAgentPicks->get($player->id, collect());
                $agentPicks = $picks->sortByDesc('count')->values();

                $totalPicks = $agentPicks->sum('count');
                if ($totalPicks == 0) {
                    continue;
                }

                $playedOutsideRole = false;
                $topAgentUrls = [];
                $topAgentNames = [];

                foreach ($agentPicks as $pick) {
                    $normalizedPick = preg_replace('/[^a-z0-9]/', '', strtolower($pick->agent_name));
                    $agentMeta = $agentsMap[$normalizedPick] ?? null;

                    $topAgentNames[] = $agentMeta ? $agentMeta['name'] : ucfirst($pick->agent_name);

                    if (count($topAgentUrls) < 3 && $agentMeta && $agentMeta['icon_url']) {
                        $topAgentUrls[] = $agentMeta['icon_url'];
                    }

                    $agentRole = $agentMeta ? $agentMeta['role'] : null;
                    if ($agentRole && strtolower($agentRole) !== strtolower($role)) {
                        $playedOutsideRole = true;
                    }
                }

                $isSpecialist = ! $playedOutsideRole;

                if ($playstyle === 'Specialist' && ! $isSpecialist) {
                    continue;
                }
                if ($playstyle === 'Adaptable' && $isSpecialist) {
                    continue;
                }

                if (! empty($preferredAgents)) {
                    $top3Names = array_slice($topAgentNames, 0, 3);
                    $hasPreference = false;
                    foreach ($preferredAgents as $pref) {
                        if (in_array($pref, $top3Names, true)) {
                            $hasPreference = true;
                            break;
                        }
                    }

                    if (! $hasPreference) {
                        continue;
                    }
                }

                $finalResults[] = [
                    'id' => $player->id,
                    'name' => $player->ign,
                    'role' => $player->current_role,
                    'smart_score' => round($player->final_score, 1),
                    'smart_status' => $player->is_provisional ? 'provisional' : 'verified',
                    'smart_confidence' => round(((float) $player->smart_confidence) * 100),
                    'adaptability' => $isSpecialist ? 'Specialist' : 'Adaptable',
                    'photo_url' => $player->photo_url,
                    'top_agents' => $topAgentUrls,
                ];
            }

            return array_slice($finalResults, 0, 20);
        });

        return response()->json($finalResponse);
    }

    public function profiles(Request $request)
    {
        $userId = $request->header('X-User-Id') ?? User::first()->id ?? null;
        if (! $userId) {
            return response()->json(['error' => 'No user found'], 400);
        }

        $profiles = Cache::remember('api_smart_profiles_'.$userId, 3600, function () use ($userId) {
            return SmartWeightProfile::with(['weightValues.criteria', 'queryFilters.criteria'])
                ->where('user_id', $userId)
                ->get()->toArray();
        });

        return response()->json($profiles);
    }

    public function storeProfile(Request $request)
    {
        $userId = $request->header('X-User-Id') ?? User::first()->id ?? null;
        if (! $userId) {
            return response()->json(['error' => 'No user found'], 400);
        }

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

            Cache::forget('api_smart_profiles_'.$userId);

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

        $cacheVersion = Cache::get('api_smart_calc_version', 'v1');
        $cacheKey = 'api_smart_calc_'.$cacheVersion.'_'.md5(json_encode($request->weights));

        $results = Cache::remember($cacheKey, 3600, function () use ($weights, $criteriaIds) {
            $criteriaMeta = SmartCriteria::whereIn('id', $criteriaIds)->get()->keyBy('id');
            $players = Player::with(['team', 'criteriaScores' => function ($q) use ($criteriaIds) {
                $q->whereIn('criteria_id', $criteriaIds);
            }])
                ->where('consistency_sample_size', '>=', ConsistencyIndexCalculator::MINIMUM_SAMPLE_SIZE)
                ->where('consistency_event_count', '>=', ConsistencyIndexCalculator::MINIMUM_EVENT_COUNT)
                ->whereNotNull('consistency_index')
                ->get();

            $minMax = [];
            foreach ($criteriaIds as $cId) {
                $scores = $players->flatMap->criteriaScores->where('criteria_id', $cId)->pluck('raw_value');
                if ($scores->isNotEmpty()) {
                    $minMax[$cId] = [
                        'min' => $scores->min(),
                        'max' => $scores->max(),
                    ];
                }
            }

            return $players->map(function ($player) use ($weights, $minMax, $criteriaMeta) {
                $score = 0;
                foreach ($weights as $w) {
                    $cId = $w['criteria_id'];
                    $ps = $player->criteriaScores->where('criteria_id', $cId)->first();
                    if ($ps && isset($minMax[$cId])) {
                        $criterion = $criteriaMeta->get($cId);

                        if ($criterion?->name === 'Consistency Index') {
                            $norm = max(0, min(1, (float) $ps->raw_value / 100));
                        } else {
                            $min = $minMax[$cId]['min'];
                            $max = $minMax[$cId]['max'];
                            $range = $max - $min;
                            $norm = $range > 0 ? ($ps->raw_value - $min) / $range : 0;

                            if ($criterion?->type === 'cost') {
                                $norm = 1 - $norm;
                            }
                        }

                        $score += ($norm * $w['weight']);
                    }
                }

                $playerData = $player->toArray();
                $playerData['selection_score'] = $score;

                return $playerData;
            })->sortByDesc('selection_score')->values()->toArray();
        });

        return response()->json($results);
    }
}
