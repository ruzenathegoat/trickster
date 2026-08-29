<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\RecalculateCompetitionQualityJob;
use App\Models\AgentMapRating;
use App\Models\AgentPatchRating;
use App\Models\MetricCalculationRun;
use App\Models\Patch;
use App\Models\PatchMapPool;
use App\Models\Player;
use App\Models\StageFormatProfile;
use App\Models\StageLabelMapping;
use App\Models\ValorantMap;
use App\Services\CompetitionQualityConfig;
use App\Services\StageMappingResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminCurationController extends Controller
{
    public function toggleIgl($id)
    {
        $player = Player::findOrFail($id);
        $player->is_igl = ! $player->is_igl;
        $player->save();

        $this->invalidateCache();

        return response()->json([
            'message' => 'Player IGL status toggled',
            'is_igl' => $player->is_igl,
        ]);
    }

    private function getCacheKey($name)
    {
        $version = Cache::get('api_admin_cache_version', 1);

        return $name.'_v'.$version;
    }

    private function invalidateCache()
    {
        Cache::put('api_admin_cache_version', microtime(true));
    }

    public function storePatchRating(Request $request)
    {
        $validated = $request->validate([
            'patch_version' => 'required|string',
            'agent' => 'required|string',
            'role' => 'required|string',
            'tier' => 'required|string|in:S,A,B,C,D',
            'direction' => 'required|string|in:buffed,nerfed,unchanged,reworked',
            'notes' => 'nullable|string',
        ]);

        $patch = Patch::firstOrCreate(['version' => $validated['patch_version']]);

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
            'confidence_level' => 'nullable|string|in:early_speculative,confirmed_by_tournament',
        ]);

        $patch = Patch::firstOrCreate(['version' => $validated['patch_version']]);

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
            'confidence_level' => 'nullable|string|in:early_speculative,confirmed_by_tournament',
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

    public function storeStageMapping(Request $request, StageMappingResolver $resolver)
    {
        $validated = $this->validateStageMapping($request);
        $validated['canonical_label'] = $validated['label_operator'] === 'exact'
            ? $resolver->canonicalize($validated['raw_label'])
            : null;
        $validated['source'] = 'curated';
        $validated['is_active'] = true;

        $mapping = StageLabelMapping::create($validated);
        $this->invalidateCache();

        return response()->json($mapping->load('profile')->loadCount('matches'), 201);
    }

    public function updateStageMapping(Request $request, StageMappingResolver $resolver, $id)
    {
        $mapping = StageLabelMapping::findOrFail($id);
        $validated = $this->validateStageMapping($request, $mapping->id);
        $validated['canonical_label'] = $validated['label_operator'] === 'exact'
            ? $resolver->canonicalize($validated['raw_label'])
            : null;
        $validated['source'] = 'curated';
        $mapping->update($validated);
        $resolver->forgetCachedMappings();
        $this->invalidateCache();

        return response()->json($mapping->fresh()->load('profile')->loadCount('matches'));
    }

    public function toggleStageMapping(StageMappingResolver $resolver, $id)
    {
        $mapping = StageLabelMapping::findOrFail($id);
        $mapping->update(['is_active' => ! $mapping->is_active]);
        $resolver->forgetCachedMappings();
        $this->invalidateCache();

        return response()->json($mapping->fresh()->load('profile')->loadCount('matches'));
    }

    public function getStageMappings(Request $request)
    {
        $query = StageLabelMapping::query()
            ->with('profile')
            ->withCount('matches')
            ->orderByDesc('priority')
            ->orderBy('raw_label');

        if ($request->filled('profile')) {
            $profileKey = (string) $request->string('profile');
            $query->whereHas('profile', fn ($profile) => $profile->where('key', $profileKey));
        }

        return response()->json($query->get());
    }

    public function getStageFormatProfiles()
    {
        return response()->json(
            StageFormatProfile::query()
                ->where('is_active', true)
                ->withCount('mappings')
                ->orderBy('id')
                ->get()
        );
    }

    public function getObservedStageLabels(Request $request)
    {
        $query = DB::table('matches as m')
            ->join('events as e', 'e.id', '=', 'm.event_id')
            ->leftJoin('stage_format_profiles as sfp', 'sfp.id', '=', 'e.stage_format_profile_id')
            ->leftJoin('stage_label_mapping as slm', 'slm.id', '=', 'm.stage_label_id')
            ->select([
                'sfp.key as profile',
                'm.raw_stage_label',
                'm.stage_resolution_source',
                'slm.normalized_stage',
                DB::raw('COUNT(*) as matches_count'),
            ])
            ->whereNotNull('m.raw_stage_label')
            ->groupBy(
                'sfp.key',
                'm.raw_stage_label',
                'm.stage_resolution_source',
                'slm.normalized_stage'
            )
            ->orderByDesc('matches_count');

        if ($request->filled('profile')) {
            $query->where('sfp.key', (string) $request->string('profile'));
        }

        return response()->json($query->get());
    }

    public function previewStageMappingImpact(Request $request, StageMappingResolver $resolver)
    {
        $validated = $this->validateStageMapping($request, null, false);
        $profile = StageFormatProfile::findOrFail($validated['stage_format_profile_id']);
        $candidate = new StageLabelMapping($validated);
        $candidate->canonical_label = $validated['label_operator'] === 'exact'
            ? $resolver->canonicalize($validated['raw_label'])
            : null;

        $matches = DB::table('matches as m')
            ->join('events as e', 'e.id', '=', 'm.event_id')
            ->where('e.stage_format_profile_id', $profile->id)
            ->select('m.raw_stage_label', 'm.match_date')
            ->get()
            ->filter(fn ($match) => $resolver->matches($candidate, $match->raw_stage_label));

        return response()->json([
            'affected_matches' => $matches->count(),
            'affected_seasons' => $matches
                ->pluck('match_date')
                ->filter()
                ->map(fn ($date) => (int) substr((string) $date, 0, 4))
                ->unique()
                ->sort()
                ->values(),
            'quality_weight' => (float) $validated['quality_weight'],
            'quality_delta_percent' => round(((float) $validated['quality_weight'] - 1.0) * 100, 2),
        ]);
    }

    public function recalculateMetrics(Request $request)
    {
        $validated = $request->validate([
            'season' => 'required|integer|min:2000|max:2100',
        ]);

        $activeRun = MetricCalculationRun::query()
            ->where('season', $validated['season'])
            ->whereIn('status', ['queued', 'running'])
            ->latest()
            ->first();
        if ($activeRun !== null) {
            return response()->json($activeRun, 202);
        }

        $run = MetricCalculationRun::create([
            'season' => $validated['season'],
            'status' => 'queued',
            'method_version' => CompetitionQualityConfig::METHOD_VERSION,
        ]);
        RecalculateCompetitionQualityJob::dispatch((int) $validated['season'], $run->id)
            ->onQueue('scrape-default');

        return response()->json($run, 202);
    }

    public function getMetricRun($id)
    {
        return response()->json(MetricCalculationRun::findOrFail($id));
    }

    /** @return array<string, mixed> */
    private function validateStageMapping(
        Request $request,
        ?int $ignoreId = null,
        bool $enforceUnique = true
    ): array {
        $rawLabelRules = ['required', 'string', 'max:255'];
        if ($enforceUnique) {
            $rawLabelRules[] = Rule::unique('stage_label_mapping', 'raw_label')
                ->where(fn ($query) => $query
                    ->where('stage_format_profile_id', $request->input('stage_format_profile_id'))
                    ->where('label_operator', $request->input('label_operator')))
                ->ignore($ignoreId);
        }

        $validated = $request->validate([
            'stage_format_profile_id' => 'required|integer|exists:stage_format_profiles,id',
            'raw_label' => $rawLabelRules,
            'label_operator' => 'required|string|in:exact,contains,regex,default',
            'normalized_stage' => 'required|string|max:100',
            'phase' => 'nullable|string|in:group,swiss,play_in,main_event,playoffs',
            'bracket' => 'nullable|string|in:upper,middle,lower,none',
            'round_number' => 'nullable|integer|min:1|max:50',
            'is_elimination_match' => 'required|boolean',
            'is_qualification_match' => 'required|boolean',
            'quality_weight' => 'required|numeric|min:0.90|max:1.15',
            'consistency_evidence_weight' => 'required|numeric|min:0|max:4',
            'priority' => 'required|integer|min:0|max:10000',
        ]);

        if ($validated['label_operator'] === 'regex') {
            $delimiter = '~';
            $pattern = $delimiter.str_replace($delimiter, '\\'.$delimiter, $validated['raw_label']).$delimiter.'iu';
            if (@preg_match($pattern, '') === false) {
                throw ValidationException::withMessages([
                    'raw_label' => ['The regular expression is invalid.'],
                ]);
            }
        }

        if ($enforceUnique && $validated['label_operator'] === 'exact') {
            $canonical = app(StageMappingResolver::class)->canonicalize($validated['raw_label']);
            $duplicate = StageLabelMapping::query()
                ->where('stage_format_profile_id', $validated['stage_format_profile_id'])
                ->where('label_operator', 'exact')
                ->where('canonical_label', $canonical)
                ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists();
            if ($duplicate) {
                throw ValidationException::withMessages([
                    'raw_label' => ['An equivalent exact label already exists in this profile.'],
                ]);
            }
        }

        return $validated;
    }

    public function getPatchRatings()
    {
        return response()->json(Cache::remember($this->getCacheKey('patch_ratings'), 3600, fn () => AgentPatchRating::with('patch')
            ->join('patches', 'agent_patch_ratings.patch_id', '=', 'patches.id')
            ->orderBy('patches.release_date', 'desc')
            ->select('agent_patch_ratings.*')
            ->get()->toArray()
        ));
    }

    public function getMapRatings()
    {
        return response()->json(Cache::remember($this->getCacheKey('map_ratings'), 3600, fn () => AgentMapRating::with('patch')
            ->join('patches', 'agent_map_ratings.patch_id', '=', 'patches.id')
            ->orderBy('patches.release_date', 'desc')
            ->select('agent_map_ratings.*')
            ->get()->toArray()
        ));
    }

    public function getPatches()
    {
        return response()->json(Cache::remember($this->getCacheKey('patches'), 3600, fn () => Patch::orderBy('release_date', 'desc')->get()->toArray()));
    }

    public function getAgents()
    {
        $agents = Cache::remember($this->getCacheKey('agents'), 3600, fn () => DB::table('valorant_agents')
            ->select('name as agent', 'role as primary_role', 'icon_url')
            ->orderBy('name')
            ->get()->toArray()
        );

        return response()->json($agents);
    }

    public function getEvents()
    {
        $events = Cache::remember($this->getCacheKey('events'), 3600, fn () => DB::table('events')
            ->select('id', 'name')
            ->orderByDesc('start_date')
            ->get()->toArray()
        );

        return response()->json($events);
    }

    public function getValorantMaps()
    {
        $maps = Cache::remember($this->getCacheKey('maps'), 3600, fn () => ValorantMap::orderBy('name')->get()->toArray());

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
            'ratings.*.notes' => 'nullable|string',
        ]);

        $patch = Patch::firstOrCreate(['version' => $validated['patch_version']]);

        DB::beginTransaction();
        try {
            $existingRatings = AgentPatchRating::where('patch_id', $patch->id)
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

            if (! empty($inserts)) {
                AgentPatchRating::insert($inserts);
            }

            DB::commit();
            $this->invalidateCache();

            return response()->json(['message' => 'Bulk patch ratings saved successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function storeBulkMapRatings(Request $request)
    {
        $validated = $request->validate([
            'patch_version' => 'required|string',
            'event_ids' => 'nullable|array',
            'event_ids.*' => 'string',
            'ratings' => 'required|array',
            'ratings.*' => 'array',
            'ratings.*.*.score' => 'required|numeric|min:1|max:10',
            'ratings.*.*.confidence_level' => 'nullable|string|in:early_speculative,confirmed_by_tournament',
            'ratings.*.*.source_reference' => 'nullable|string',
        ]);

        $patch = Patch::firstOrCreate(['version' => $validated['patch_version']]);

        DB::beginTransaction();
        try {
            if (isset($validated['event_ids'])) {
                $patch->events()->sync($validated['event_ids']);
            }

            $existingCollection = AgentMapRating::where('patch_id', $patch->id)
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

            if (! empty($inserts)) {
                AgentMapRating::insert($inserts);
            }

            DB::commit();
            $this->invalidateCache();

            return response()->json(['message' => 'Bulk map ratings saved successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();

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

        $snapshots = DB::table('agent_pick_rate_snapshots')
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

            if (! isset($stats[$map])) {
                $stats[$map] = [];
            }
            if (! isset($stats[$map][$agent])) {
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
                if ($data['total_matches'] == 0) {
                    continue;
                }

                $pickRate = ($data['total_picks'] / $data['total_matches']) * 100;

                $score = 5;
                if ($pickRate > 50) {
                    $score = 10;
                } elseif ($pickRate > 30) {
                    $score = 8;
                } elseif ($pickRate > 15) {
                    $score = 6;
                } elseif ($pickRate > 5) {
                    $score = 4;
                } else {
                    $score = 2;
                }

                $ratings[$map][$agent] = [
                    'score' => $score,
                    'confidence_level' => 'confirmed_by_tournament',
                    'source_reference' => 'Auto-calculated from '.count($eventIds).' events',
                ];
            }
        }

        return response()->json(['ratings' => $ratings]);
    }

    public function getMapRatingsByPatch($patchId)
    {
        $ratings = AgentMapRating::where('patch_id', $patchId)
            ->whereNull('superseded_by_id')
            ->get();

        $formatted = [];
        foreach ($ratings as $r) {
            if (! isset($formatted[$r->map])) {
                $formatted[$r->map] = [];
            }
            $formatted[$r->map][$r->agent] = [
                'score' => $r->score,
                'confidence_level' => $r->confidence_level,
                'source_reference' => $r->source_reference,
            ];
        }

        return response()->json($formatted);
    }

    public function getPatchMapPool($patchId)
    {
        $pool = PatchMapPool::where('patch_id', $patchId)->pluck('map_name');

        return response()->json($pool);
    }

    public function savePatchMapPool(Request $request)
    {
        $validated = $request->validate([
            'patch_version' => 'required|string',
            'maps' => 'required|array',
            'maps.*' => 'string',
        ]);

        $patch = Patch::firstOrCreate(['version' => $validated['patch_version']]);

        DB::beginTransaction();
        try {
            PatchMapPool::where('patch_id', $patch->id)->delete();

            $inserts = [];
            foreach ($validated['maps'] as $map) {
                $inserts[] = [
                    'patch_id' => $patch->id,
                    'map_name' => $map,
                ];
            }
            if (! empty($inserts)) {
                PatchMapPool::insert($inserts);
            }

            DB::commit();
            $this->invalidateCache();

            return response()->json(['message' => 'Patch map pool saved successfully']);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
