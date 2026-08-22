<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Services\CompetitionQualityConfig;
use App\Services\PlayerMomentumService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PlayerController extends Controller
{
    public function momentum(Request $request, PlayerMomentumService $service)
    {
        $eventId = $request->filled('event_id') ? (string) $request->get('event_id') : null;
        $season = max(2020, min(2100, (int) $request->get('season', 2026)));
        $page = max(1, (int) $request->get('page', 1));
        $perPage = max(10, min(50, (int) $request->get('per_page', 25)));
        $filters = [
            'q' => trim((string) $request->get('q', '')),
            'role' => (string) $request->get('role', 'All'),
            'region' => (string) $request->get('region', 'All'),
            'category' => (string) $request->get('category', 'All'),
        ];
        $version = Cache::get('api_admin_cache_version', 'v1');
        $datasetCacheKey = 'api_player_momentum_dataset_'.$version.'_'.md5(json_encode(compact('eventId', 'season')));
        $dataset = Cache::remember(
            $datasetCacheKey,
            3600,
            fn (): array => $service->build($eventId, $season)
        );

        return response()->json($service->paginate($dataset, $page, $perPage, $filters));
    }

    public function index(Request $request)
    {
        // Layer 1 & 2 Caching: dynamic cache key based on query parameters
        $page = $request->get('page', 1);
        $q = $request->get('q', '');
        $role = $request->get('role', 'All');
        $sortBy = strtolower($request->get('sort_by', 'smart'));
        $sortDir = strtolower($request->get('sort_dir', 'desc'));
        $limit = (int) $request->get('limit', 20);

        $validSortDirs = ['asc', 'desc'];
        if (! in_array($sortDir, $validSortDirs)) {
            $sortDir = 'desc';
        }

        $version = Cache::get('api_admin_cache_version', 'v1');
        $cacheKey = 'api_players_explorer_'.$version.'_'.md5(json_encode(compact('page', 'q', 'role', 'sortBy', 'sortDir', 'limit')));

        $paginatorArray = Cache::remember($cacheKey, 3600, function () use ($q, $role, $sortBy, $sortDir, $limit) {
            $query = DB::table('players')
                ->leftJoin('teams', 'teams.id', '=', 'players.team_id')
                ->leftJoin('player_smart_results', function ($join) {
                    $join->on('players.id', '=', 'player_smart_results.player_id')
                        ->where('player_smart_results.mode', '=', 'career');
                })
                ->select(
                    'players.id',
                    'players.ign',
                    'players.name',
                    'players.is_igl',
                    'players.current_role',
                    'players.photo_url',
                    'players.avg_acs',
                    'players.avg_kd',
                    'players.avg_adr',
                    'players.avg_fk',
                    'players.avg_fd',
                    'players.avg_rating',
                    'players.consistency_index',
                    'players.consistency_provisional_index',
                    'players.consistency_sample_size',
                    'players.consistency_event_count',
                    'teams.name as team_name',
                    'teams.region as team_region',
                    'player_smart_results.final_score as smart_final_score',
                    'player_smart_results.rank as smart_rank',
                    'player_smart_results.is_provisional as smart_is_provisional',
                    'player_smart_results.smart_confidence'
                );

            if (! empty($q)) {
                $leetspeakMap = ['0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't'];
                $normalizedQ = str_replace(array_keys($leetspeakMap), array_values($leetspeakMap), strtolower($q));

                $query->where(function ($qBuilder) use ($q, $normalizedQ) {
                    $qBuilder->where('players.ign', 'ilike', '%'.$q.'%')
                        ->orWhere('players.name', 'ilike', '%'.$q.'%')
                        ->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(players.ign), '0', 'o'), '1', 'i'), '3', 'e'), '4', 'a'), '5', 's'), '7', 't') LIKE ?", ['%'.$normalizedQ.'%']);
                });
            }

            if ($role !== 'All') {
                $query->where('players.current_role', $role);
            }

            switch ($sortBy) {
                case 'acs':
                    $query->orderBy('players.avg_acs', $sortDir);
                    break;
                case 'kd':
                    $query->orderBy('players.avg_kd', $sortDir);
                    break;
                case 'adr':
                    $query->orderBy('players.avg_adr', $sortDir);
                    break;
                case 'fkfd':
                    $query->orderByRaw('(players.avg_fk - players.avg_fd) '.$sortDir);
                    break;
                case 'smart':
                default:
                    $query->orderByRaw('CASE WHEN player_smart_results.final_score IS NULL THEN 1 ELSE 0 END')
                        ->orderBy('player_smart_results.final_score', $sortDir)
                        ->orderBy('players.ign', 'asc');
                    break;
            }

            $paginated = $query->paginate($limit);

            // Transform raw objects to nested structure expected by frontend
            $paginated->getCollection()->transform(function ($result) {
                return [
                    'id' => $result->id,
                    'ign' => $result->ign,
                    'name' => $result->name,
                    'is_igl' => (bool) $result->is_igl,
                    'current_role' => $result->current_role,
                    'photo_url' => $result->photo_url,
                    'avg_acs' => $result->avg_acs,
                    'avg_kd' => $result->avg_kd,
                    'avg_adr' => $result->avg_adr,
                    'avg_fk' => $result->avg_fk,
                    'avg_fd' => $result->avg_fd,
                    'avg_rating' => $result->avg_rating,
                    'consistency_index' => $result->consistency_index,
                    'consistency_provisional_index' => $result->consistency_provisional_index,
                    'consistency_sample_size' => $result->consistency_sample_size,
                    'consistency_event_count' => $result->consistency_event_count,
                    'team' => [
                        'name' => $result->team_name,
                        'region' => $result->team_region,
                    ],
                    'smart_results' => $result->smart_final_score === null
                        ? []
                        : [[
                            'mode' => 'career',
                            'final_score' => $result->smart_final_score,
                            'rank' => $result->smart_rank,
                            'is_provisional' => (bool) $result->smart_is_provisional,
                            'confidence' => (float) $result->smart_confidence,
                        ]],
                ];
            });

            return $paginated->toArray();
        });

        return response()->json($paginatorArray);
    }

    public function show($id)
    {
        $cacheKey = 'api_player_profile_'.$id;

        $playerData = Cache::remember($cacheKey, 3600, function () use ($id) {
            $player = Player::with([
                'team',
                'smartResults' => function ($q) {
                    $q->where('mode', 'career');
                },
            ])->findOrFail($id);

            $smartResult = $player->smartResults->first();
            $smartScore = $smartResult?->final_score;
            $competition = DB::table('player_competition_metrics')
                ->where('player_id', $id)
                ->orderByDesc('season')
                ->first();

            $agents = DB::table('player_match_agents')
                ->where('player_id', $id)
                ->select('agent_name', DB::raw('count(*) as count'))
                ->groupBy('agent_name')
                ->orderBy('count', 'desc')
                ->get();

            $totalMatches = $player->total_matches > 0 ? $player->total_matches : 1;

            // Preload all agent definitions once, keyed by normalized name
            // (lowercase, slashes removed) to avoid an N+1 query per agent.
            $agentDefs = DB::table('valorant_agents')
                ->select('name', 'icon_url')
                ->get()
                ->keyBy(fn ($agent) => strtolower(str_replace('/', '', $agent->name)));

            $mostPickedAgents = $agents->map(function ($a) use ($totalMatches, $agentDefs) {
                $agentDef = $agentDefs->get(strtolower(str_replace('/', '', $a->agent_name)));

                return [
                    'name' => $a->agent_name,
                    'count' => $a->count,
                    'percentage' => round(($a->count / $totalMatches) * 100, 1).'%',
                    'icon_url' => $agentDef ? $agentDef->icon_url : null,
                ];
            })->values()->toArray();

            $defaultProfile = DB::table('smart_weight_profiles')
                ->where('is_public', true)
                ->orderBy('created_at', 'asc')
                ->first();

            $historyQuery = DB::table('player_smart_rank_history')
                ->where('player_id', $id)
                ->where('mode', 'career');

            if ($defaultProfile) {
                $historyQuery->where('profile_id', $defaultProfile->id);
            }

            $history = $historyQuery->orderBy('snapshot_date', 'asc')->get();

            $rankHistory = $history->map(function ($h) {
                return [
                    'date' => date('Y-m-d', strtotime($h->snapshot_date)),
                    'rank' => (int) $h->rank,
                    'score' => round((float) $h->final_score, 1),
                ];
            })->values()->toArray();

            // Calculate current rank shift based on history
            $rankShift = '0';
            if (count($rankHistory) >= 2) {
                $last = $rankHistory[count($rankHistory) - 1]['rank'];
                $prev = $rankHistory[count($rankHistory) - 2]['rank'];
                $diff = $prev - $last; // if prev was 5 and last is 2, diff is +3
                if ($diff > 0) {
                    $rankShift = '+'.$diff;
                } elseif ($diff < 0) {
                    $rankShift = (string) $diff;
                }
            }

            $radarStats = [
                'ACS' => round(min(100, max(0, ($player->avg_acs / 300) * 100))),
                'K/D' => round(min(100, max(0, ($player->avg_kd / 2.0) * 100))),
                'KAST' => round($player->avg_kast),
                'ADR' => round(min(100, max(0, ($player->avg_adr / 200) * 100))),
                'Adaptability' => round($player->meta_adaptability_index ?? 50),
                'Flexibility' => round($player->flexibility_score ?? 50),
            ];

            if ($player->consistency_index !== null) {
                $radarStats['Consistency'] = round($player->consistency_index);
            }

            return [
                'id' => $player->id,
                'ign' => $player->ign,
                'name' => $player->name,
                'country' => $player->country,
                'team_name' => $player->team ? $player->team->name : 'F/A',
                'team_logo' => $player->team ? $player->team->logo_url : null,
                'photo_url' => $player->photo_url,
                'role' => $player->current_role,
                'smart_score' => $smartScore !== null ? round($smartScore, 1) : null,
                'smart_rank' => $smartResult?->rank,
                'smart_status' => $smartResult === null
                    ? null
                    : ($smartResult->is_provisional ? 'provisional' : 'verified'),
                'smart_confidence' => $smartResult?->smart_confidence,
                'smart_rank_history' => $rankHistory,
                'rank_shift' => $rankShift,
                'raw_stats' => [
                    'matches' => $player->total_matches,
                    'win_rate' => round($player->win_rate, 1).'%',
                    'rating' => round($player->avg_rating, 2),
                    'acs' => round($player->avg_acs, 1),
                    'kd' => round($player->avg_kd, 2),
                    'kast' => round($player->avg_kast, 1).'%',
                    'adr' => round($player->avg_adr, 1),
                ],
                'consistency' => [
                    'value' => $player->consistency_index === null ? null : round($player->consistency_index, 2),
                    'provisional_value' => $player->consistency_provisional_index === null
                        ? null
                        : round($player->consistency_provisional_index, 2),
                    'eligible' => $player->consistency_index !== null
                        && $player->consistency_sample_size >= CompetitionQualityConfig::MINIMUM_MATCHES
                        && $player->consistency_event_count >= CompetitionQualityConfig::MINIMUM_EVENTS,
                    'sample_size' => $player->consistency_sample_size,
                    'minimum_sample_size' => CompetitionQualityConfig::MINIMUM_MATCHES,
                    'event_count' => $player->consistency_event_count,
                    'minimum_event_count' => CompetitionQualityConfig::MINIMUM_EVENTS,
                    'method' => $player->consistency_method,
                    'calculated_at' => $player->consistency_calculated_at?->toIso8601String(),
                ],
                'competition_quality' => $competition === null ? null : [
                    'season' => (int) $competition->season,
                    'exposure_percentile' => round((float) $competition->cqi_percentile, 2),
                    'raw_match_quality' => round((float) $competition->cqi_raw, 3),
                    'weighted_performance' => round((float) $competition->weighted_performance, 2),
                    'proven_consistency' => round((float) $competition->proven_consistency, 2),
                    'international_matches' => (int) $competition->international_matches,
                    'international_events' => (int) $competition->international_events,
                    'validation_status' => $competition->validation_status,
                    'confidence' => round((float) $competition->confidence, 4),
                    'method' => $competition->method_version,
                ],
                'radar_stats' => $radarStats,
                'most_picked_agents' => $mostPickedAgents,
            ];
        });

        return response()->json($playerData);
    }
}
