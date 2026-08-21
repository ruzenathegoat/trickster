<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

final class PlayerMomentumService
{
    public const METHOD_VERSION = 'player-momentum-mvp-v1';

    public function __construct(private readonly EventPerformanceCalculator $calculator) {}

    /**
     * @return array<string, mixed>
     */
    public function build(?string $eventId = null, int $season = 2026): array
    {
        $snapshots = $this->calculator->scoreSnapshots($this->loadSnapshots($season));
        $events = $this->eventOptions($snapshots);
        $selectedEventIds = $this->selectedEventIds($events, $eventId);
        $currentSnapshots = array_values(array_filter(
            $snapshots,
            fn (array $snapshot): bool => in_array($snapshot['event_id'], $selectedEventIds, true)
        ));

        $snapshotsByPlayer = [];
        foreach ($snapshots as $snapshot) {
            $snapshotsByPlayer[$snapshot['player_id']][] = $snapshot;
        }

        foreach ($snapshotsByPlayer as &$playerSnapshots) {
            usort($playerSnapshots, fn (array $a, array $b): int => strcmp($a['last_match_date'], $b['last_match_date']));
        }
        unset($playerSnapshots);

        $players = [];
        foreach ($currentSnapshots as $current) {
            $history = $snapshotsByPlayer[$current['player_id']] ?? [];
            $comparator = $this->findComparator($history, $current);
            $trajectory = $this->trajectory($history, $current);
            $players[] = $this->buildPlayerMomentum($current, $comparator, $trajectory, $history);
        }

        $eligibleDeltas = array_values(array_map(
            fn (array $player): float => $player['adjusted_delta'],
            array_filter($players, fn (array $player): bool => $player['eligible'])
        ));
        $positiveThreshold = max(2.0, $this->calculator->quantile($eligibleDeltas, 0.75));
        $negativeThreshold = min(-2.0, $this->calculator->quantile($eligibleDeltas, 0.25));

        foreach ($players as &$player) {
            $player['category'] = $this->classify($player, $positiveThreshold, $negativeThreshold);
        }
        unset($player);

        $globalRankAvailable = count($selectedEventIds) === 1
            && ($this->eventById($events, $selectedEventIds[0])['region'] ?? null) === 'International';
        $players = $this->assignRanks($players, $globalRankAvailable);
        usort($players, function (array $a, array $b): int {
            $eligibility = (int) $b['eligible'] <=> (int) $a['eligible'];

            return $eligibility !== 0
                ? $eligibility
                : $b['adjusted_delta'] <=> $a['adjusted_delta'];
        });

        return [
            'meta' => [
                'method' => self::METHOD_VERSION,
                'performance_method' => EventPerformanceCalculator::METHOD_VERSION,
                'season' => $season,
                'scope' => $eventId ? 'event' : 'latest_regional',
                'selected_event_ids' => $selectedEventIds,
                'minimum_matches' => EventPerformanceCalculator::MINIMUM_MATCHES,
                'reliability_k' => EventPerformanceCalculator::RELIABILITY_K,
                'weights' => EventPerformanceCalculator::METRIC_WEIGHTS,
                'global_rank_available' => $globalRankAvailable,
                'positive_threshold' => round($positiveThreshold, 2),
                'negative_threshold' => round($negativeThreshold, 2),
                'benchmark' => 'Fixed season, role, and event tier cohort with P5/P95 winsorization',
            ],
            'events' => $events,
            'regions' => $this->regionSummary($players),
            'data' => $players,
        ];
    }

    /**
     * Paginate and filter an already cached momentum dataset. Database work is
     * performed once by build(), while page and filter changes only slice cache.
     *
     * @param  array<string, mixed>  $result
     * @param  array<string, string>  $filters
     * @return array<string, mixed>
     */
    public function paginate(array $result, int $page, int $perPage, array $filters = []): array
    {
        $query = mb_strtolower(trim($filters['q'] ?? ''));
        $role = $filters['role'] ?? 'All';
        $region = $filters['region'] ?? 'All';
        $category = $filters['category'] ?? 'All';
        $players = array_values(array_filter($result['data'], function (array $player) use ($query, $role, $region, $category): bool {
            $haystack = mb_strtolower(implode(' ', [
                $player['ign'],
                $player['name'],
                $player['team_name'],
            ]));

            return ($query === '' || str_contains($haystack, $query))
                && ($role === 'All' || $player['role'] === $role)
                && ($region === 'All' || $player['region'] === $region)
                && ($category === 'All' || $player['category'] === $category);
        }));

        $total = count($players);
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page = min(max(1, $page), $lastPage);
        $offset = ($page - 1) * $perPage;
        $eligible = array_values(array_filter($players, fn (array $player): bool => $player['eligible']));
        $eligibleDeltas = array_column($eligible, 'adjusted_delta');

        $result['meta']['summary'] = [
            'players' => $total,
            'eligible_players' => count($eligible),
            'rising' => count(array_filter($eligible, fn (array $player): bool => in_array($player['category'], ['breakout', 'steady_climber', 'improving'], true))),
            'declining' => count(array_filter($eligible, fn (array $player): bool => $player['category'] === 'declining')),
            'median_momentum' => round($this->calculator->quantile($eligibleDeltas, 0.5), 1),
        ];
        $result['regions'] = $this->regionSummary($players);
        $result['overview'] = $this->overviewPlayers($players);
        $result['data'] = array_slice($players, $offset, $perPage);
        $result['pagination'] = [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => $lastPage,
            'from' => $total === 0 ? 0 : $offset + 1,
            'to' => min($offset + $perPage, $total),
        ];

        return $result;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function loadSnapshots(int $season): array
    {
        $eventRoles = $this->eventRoleMap();

        return DB::table('player_map_stats as pms')
            ->join('maps as momentum_maps', 'momentum_maps.id', '=', 'pms.map_id')
            ->join('matches as momentum_matches', 'momentum_matches.id', '=', 'pms.match_id')
            ->join('events as momentum_events', 'momentum_events.id', '=', 'momentum_matches.event_id')
            ->join('players as momentum_players', 'momentum_players.id', '=', 'pms.player_id')
            ->leftJoin('teams as momentum_teams', 'momentum_teams.id', '=', 'momentum_players.team_id')
            ->leftJoin('patches as momentum_patches', 'momentum_patches.id', '=', 'momentum_matches.patch_id')
            ->where('momentum_maps.map_name', 'All Maps')
            ->whereNotNull('momentum_matches.winner_team_id')
            ->whereNotNull('pms.acs')
            ->where('pms.acs', '>', 0)
            ->select(
                'momentum_players.id as player_id',
                'momentum_players.ign',
                'momentum_players.name',
                'momentum_players.photo_url',
                'momentum_players.current_role',
                'momentum_teams.name as team_name',
                'momentum_teams.region as team_region',
                'momentum_events.id as event_id',
                'momentum_events.name as event_name',
                'momentum_events.region as event_region',
                'momentum_events.tier as event_tier',
                DB::raw('MIN(momentum_matches.match_date) as first_match_date'),
                DB::raw('MAX(momentum_matches.match_date) as last_match_date'),
                DB::raw('MAX(momentum_patches.version) as patch_version'),
                DB::raw('COUNT(DISTINCT pms.match_id) as valid_matches'),
                DB::raw('AVG(pms.acs) as avg_acs'),
                DB::raw('AVG(pms.adr) as avg_adr'),
                DB::raw('AVG(pms.kast) as avg_kast'),
                DB::raw('SUM(pms.kills) as total_kills'),
                DB::raw('SUM(pms.deaths) as total_deaths')
            )
            ->groupBy(
                'momentum_players.id',
                'momentum_players.ign',
                'momentum_players.name',
                'momentum_players.photo_url',
                'momentum_players.current_role',
                'momentum_teams.name',
                'momentum_teams.region',
                'momentum_events.id',
                'momentum_events.name',
                'momentum_events.region',
                'momentum_events.tier'
            )
            ->get()
            ->filter(fn (object $row): bool => $row->last_match_date
                && Carbon::parse($row->last_match_date)->year === $season)
            ->map(function (object $row) use ($eventRoles): array {
                $role = $eventRoles[$row->player_id][$row->event_id] ?? $row->current_role ?? 'Flex';
                $deaths = (int) $row->total_deaths;

                return [
                    'player_id' => (string) $row->player_id,
                    'ign' => (string) $row->ign,
                    'name' => (string) ($row->name ?? ''),
                    'photo_url' => $row->photo_url,
                    'team_name' => (string) ($row->team_name ?? 'Free Agent'),
                    'team_region' => $row->team_region,
                    'role' => $role,
                    'event_id' => (string) $row->event_id,
                    'event_name' => (string) $row->event_name,
                    'event_region' => (string) ($row->event_region ?? 'Unknown'),
                    'tier' => (string) ($row->event_tier ?? 'Unrated'),
                    'first_match_date' => (string) $row->first_match_date,
                    'last_match_date' => (string) $row->last_match_date,
                    'patch_version' => $row->patch_version,
                    'valid_matches' => (int) $row->valid_matches,
                    'acs' => round((float) $row->avg_acs, 2),
                    'adr' => round((float) $row->avg_adr, 2),
                    'kast' => round((float) $row->avg_kast, 2),
                    'kd' => $deaths > 0 ? round((int) $row->total_kills / $deaths, 3) : (float) $row->total_kills,
                ];
            })
            ->values()
            ->all();
    }

    /** @return array<string, array<string, string>> */
    private function eventRoleMap(): array
    {
        $agentRoles = DB::table('agent_role_maps')
            ->pluck('role_name', 'agent_name')
            ->mapWithKeys(fn (string $role, string $agent): array => [strtolower($agent) => ucfirst(strtolower($role))])
            ->all();

        $picks = DB::table('player_match_agents as role_picks')
            ->join('matches as role_matches', 'role_matches.id', '=', 'role_picks.match_id')
            ->select(
                'role_picks.player_id',
                'role_matches.event_id',
                'role_picks.agent_name',
                DB::raw('COUNT(*) as pick_count')
            )
            ->groupBy('role_picks.player_id', 'role_matches.event_id', 'role_picks.agent_name')
            ->get();

        $counts = [];
        foreach ($picks as $pick) {
            $role = $agentRoles[strtolower((string) $pick->agent_name)] ?? null;
            if ($role === null) {
                continue;
            }
            $counts[$pick->player_id][$pick->event_id][$role] =
                ($counts[$pick->player_id][$pick->event_id][$role] ?? 0) + (int) $pick->pick_count;
        }

        $result = [];
        foreach ($counts as $playerId => $events) {
            foreach ($events as $eventId => $roles) {
                if (count($roles) > 2) {
                    $result[$playerId][$eventId] = 'Flex';

                    continue;
                }
                arsort($roles);
                $result[$playerId][$eventId] = (string) array_key_first($roles);
            }
        }

        return $result;
    }

    /**
     * @param  array<int, array<string, mixed>>  $snapshots
     * @return array<int, array<string, mixed>>
     */
    private function eventOptions(array $snapshots): array
    {
        $events = [];
        foreach ($snapshots as $snapshot) {
            $id = $snapshot['event_id'];
            if (! isset($events[$id])) {
                $events[$id] = [
                    'id' => $id,
                    'name' => $snapshot['event_name'],
                    'region' => $snapshot['event_region'],
                    'tier' => $snapshot['tier'],
                    'last_match_date' => $snapshot['last_match_date'],
                    'player_count' => 0,
                ];
            }
            $events[$id]['player_count']++;
        }

        $events = array_values($events);
        usort($events, fn (array $a, array $b): int => strcmp($b['last_match_date'], $a['last_match_date']));

        return $events;
    }

    /**
     * @param  array<int, array<string, mixed>>  $events
     * @return array<int, string>
     */
    private function selectedEventIds(array $events, ?string $eventId): array
    {
        if ($eventId !== null && $this->eventById($events, $eventId) !== null) {
            return [$eventId];
        }

        $latestByRegion = [];
        foreach ($events as $event) {
            $region = $event['region'];
            if ($region === 'International' || $region === 'Unknown') {
                continue;
            }
            if (! isset($latestByRegion[$region])) {
                $latestByRegion[$region] = $event['id'];
            }
        }

        return array_values($latestByRegion);
    }

    /**
     * @param  array<int, array<string, mixed>>  $history
     * @param  array<string, mixed>  $current
     * @return array<string, mixed>|null
     */
    private function findComparator(array $history, array $current): ?array
    {
        $candidates = array_values(array_filter($history, fn (array $snapshot): bool => $snapshot['event_region'] === $current['event_region']
            && $snapshot['tier'] === $current['tier']
            && $snapshot['last_match_date'] < $current['last_match_date']
        ));

        return $candidates === [] ? null : $candidates[array_key_last($candidates)];
    }

    /**
     * @param  array<int, array<string, mixed>>  $history
     * @param  array<string, mixed>  $current
     * @return array<int, array<string, mixed>>
     */
    private function trajectory(array $history, array $current): array
    {
        $trajectory = array_values(array_filter($history, fn (array $snapshot): bool => $snapshot['event_region'] === $current['event_region']
            && $snapshot['tier'] === $current['tier']
            && $snapshot['last_match_date'] <= $current['last_match_date']
        ));

        return array_slice(array_map(fn (array $snapshot): array => [
            'event_id' => $snapshot['event_id'],
            'event_name' => $snapshot['event_name'],
            'date' => $snapshot['last_match_date'],
            'score' => $snapshot['performance_score'],
            'valid_matches' => $snapshot['valid_matches'],
        ], $trajectory), -5);
    }

    /**
     * @param  array<string, mixed>  $current
     * @param  array<string, mixed>|null  $comparator
     * @param  array<int, array<string, mixed>>  $trajectory
     * @param  array<int, array<string, mixed>>  $history
     * @return array<string, mixed>
     */
    private function buildPlayerMomentum(array $current, ?array $comparator, array $trajectory, array $history): array
    {
        $reliability = $comparator
            ? $this->calculator->pairReliability($current['valid_matches'], $comparator['valid_matches'])
            : 0.0;
        $rawDelta = $comparator ? $current['performance_score'] - $comparator['performance_score'] : 0.0;
        $roleChanged = $comparator !== null && $current['role'] !== $comparator['role'];
        $patchChanged = $comparator !== null
            && $current['patch_version'] !== null
            && $comparator['patch_version'] !== null
            && $current['patch_version'] !== $comparator['patch_version'];
        $eligible = $comparator !== null
            && $current['valid_matches'] >= EventPerformanceCalculator::MINIMUM_MATCHES
            && $comparator['valid_matches'] >= EventPerformanceCalculator::MINIMUM_MATCHES
            && ! $roleChanged;
        $homeRegion = $this->homeRegion($history, $current);

        $metricDeltas = [];
        foreach (EventPerformanceCalculator::METRIC_WEIGHTS as $metric => $weight) {
            $percentileDelta = $comparator
                ? $current['metric_percentiles'][$metric] - $comparator['metric_percentiles'][$metric]
                : 0.0;
            $metricDeltas[$metric] = round($percentileDelta * $weight * $reliability, 2);
        }

        return [
            'player_id' => $current['player_id'],
            'ign' => $current['ign'],
            'name' => $current['name'],
            'photo_url' => $current['photo_url'],
            'team_name' => $current['team_name'],
            'role' => $current['role'],
            'region' => $homeRegion,
            'current_event' => $this->eventPayload($current),
            'comparator_event' => $comparator ? $this->eventPayload($comparator) : null,
            'current_performance' => $current['performance_score'],
            'previous_performance' => $comparator['performance_score'] ?? null,
            'raw_delta' => round($rawDelta, 1),
            'adjusted_delta' => round($rawDelta * $reliability, 1),
            'confidence' => round($reliability * 100, 1),
            'confidence_level' => $this->confidenceLevel($reliability),
            'eligible' => $eligible,
            'category' => 'stable',
            'regional_rank' => null,
            'global_rank' => null,
            'current_metrics' => $this->metricPayload($current),
            'previous_metrics' => $comparator ? $this->metricPayload($comparator) : null,
            'metric_delta_contributions' => $metricDeltas,
            'trajectory' => $trajectory,
            'trend_slope' => round($this->calculator->linearSlope(array_column($trajectory, 'score')), 2),
            'context_flags' => array_values(array_filter([
                $roleChanged ? 'role_changed' : null,
                $patchChanged ? 'patch_changed' : null,
                $current['event_region'] === 'International' ? 'direct_global' : 'regional_benchmark',
                $current['benchmark_scope'] === 'tier_fallback' ? 'tier_benchmark_fallback' : null,
            ])),
        ];
    }

    /** @param array<string, mixed> $snapshot */
    private function eventPayload(array $snapshot): array
    {
        return [
            'id' => $snapshot['event_id'],
            'name' => $snapshot['event_name'],
            'region' => $snapshot['event_region'],
            'tier' => $snapshot['tier'],
            'last_match_date' => $snapshot['last_match_date'],
            'patch' => $snapshot['patch_version'],
            'valid_matches' => $snapshot['valid_matches'],
        ];
    }

    /** @param array<string, mixed> $snapshot */
    private function metricPayload(array $snapshot): array
    {
        $result = [];
        foreach (array_keys(EventPerformanceCalculator::METRIC_WEIGHTS) as $metric) {
            $result[$metric] = [
                'raw' => $snapshot[$metric],
                'percentile' => $snapshot['metric_percentiles'][$metric],
            ];
        }

        return $result;
    }

    /**
     * @param  array<int, array<string, mixed>>  $history
     * @param  array<string, mixed>  $current
     */
    private function homeRegion(array $history, array $current): string
    {
        if ($current['event_region'] !== 'International') {
            return $current['event_region'];
        }

        $regionalHistory = array_values(array_filter($history, fn (array $snapshot): bool => $snapshot['event_region'] !== 'International'
            && $snapshot['last_match_date'] <= $current['last_match_date']
        ));

        if ($regionalHistory !== []) {
            return (string) $regionalHistory[array_key_last($regionalHistory)]['event_region'];
        }

        return (string) ($current['team_region'] ?? 'International');
    }

    /** @param array<string, mixed> $player */
    private function classify(array $player, float $positiveThreshold, float $negativeThreshold): string
    {
        if ($player['comparator_event'] === null) {
            return 'no_baseline';
        }
        if (in_array('role_changed', $player['context_flags'], true)) {
            return 'context_changed';
        }
        if (! $player['eligible']) {
            return 'limited_evidence';
        }

        $scores = array_column($player['trajectory'], 'score');
        $deltas = [];
        for ($index = 1; $index < count($scores); $index++) {
            $deltas[] = $scores[$index] - $scores[$index - 1];
        }
        $hasSignChange = count($deltas) >= 2
            && min($deltas) < 0
            && max($deltas) > 0;
        $range = $scores === [] ? 0 : max($scores) - min($scores);

        if (count($scores) >= 3 && $hasSignChange && $range >= 18) {
            return 'volatile';
        }
        if ($player['current_performance'] >= 75
            && $player['previous_performance'] < 60
            && $player['adjusted_delta'] >= $positiveThreshold) {
            return 'breakout';
        }
        if (count($deltas) >= 2
            && min(array_slice($deltas, -2)) > 0
            && $player['trend_slope'] >= 2) {
            return 'steady_climber';
        }
        if ($player['adjusted_delta'] >= $positiveThreshold) {
            return 'improving';
        }
        if ($player['adjusted_delta'] <= $negativeThreshold) {
            return 'declining';
        }

        return 'stable';
    }

    /**
     * @param  array<int, array<string, mixed>>  $players
     * @return array<int, array<string, mixed>>
     */
    private function assignRanks(array $players, bool $globalRankAvailable): array
    {
        $regionalGroups = [];
        foreach ($players as $index => $player) {
            if ($player['eligible']) {
                $regionalGroups[$player['region']][] = $index;
            }
        }

        foreach ($regionalGroups as $indexes) {
            usort($indexes, fn (int $a, int $b): int => $players[$b]['adjusted_delta'] <=> $players[$a]['adjusted_delta']);
            foreach ($indexes as $rank => $index) {
                $players[$index]['regional_rank'] = $rank + 1;
            }
        }

        if ($globalRankAvailable) {
            $indexes = array_values(array_filter(array_keys($players), fn (int $index): bool => $players[$index]['eligible']));
            usort($indexes, fn (int $a, int $b): int => $players[$b]['adjusted_delta'] <=> $players[$a]['adjusted_delta']);
            foreach ($indexes as $rank => $index) {
                $players[$index]['global_rank'] = $rank + 1;
            }
        }

        return $players;
    }

    /**
     * @param  array<int, array<string, mixed>>  $players
     * @return array<int, array<string, mixed>>
     */
    private function regionSummary(array $players): array
    {
        $groups = [];
        foreach ($players as $player) {
            $groups[$player['region']][] = $player;
        }

        $result = [];
        foreach ($groups as $region => $items) {
            $eligible = array_values(array_filter($items, fn (array $item): bool => $item['eligible']));
            usort($eligible, fn (array $a, array $b): int => $b['adjusted_delta'] <=> $a['adjusted_delta']);
            $result[] = [
                'region' => $region,
                'players' => count($items),
                'eligible_players' => count($eligible),
                'median_momentum' => round($this->calculator->quantile(array_column($eligible, 'adjusted_delta'), 0.5), 1),
                'improving' => count(array_filter($eligible, fn (array $item): bool => in_array($item['category'], ['improving', 'breakout', 'steady_climber'], true))),
                'declining' => count(array_filter($eligible, fn (array $item): bool => $item['category'] === 'declining')),
                'top_mover' => $eligible === [] ? null : [
                    'player_id' => $eligible[0]['player_id'],
                    'ign' => $eligible[0]['ign'],
                    'photo_url' => $eligible[0]['photo_url'],
                    'adjusted_delta' => $eligible[0]['adjusted_delta'],
                ],
                'leaders' => array_map(fn (array $player): array => [
                    'player_id' => $player['player_id'],
                    'ign' => $player['ign'],
                    'photo_url' => $player['photo_url'],
                    'adjusted_delta' => $player['adjusted_delta'],
                    'category' => $player['category'],
                    'role' => $player['role'],
                ], array_slice($eligible, 0, 5)),
            ];
        }

        usort($result, fn (array $a, array $b): int => strcmp($a['region'], $b['region']));

        return $result;
    }

    /**
     * Keep a compact but balanced set for the quadrant independent from the
     * paginated table. Each region contributes its strongest rises and drops.
     *
     * @param  array<int, array<string, mixed>>  $players
     * @return array<int, array<string, mixed>>
     */
    private function overviewPlayers(array $players): array
    {
        $groups = [];
        foreach ($players as $player) {
            if ($player['eligible']) {
                $groups[$player['region']][] = $player;
            }
        }

        $overview = [];
        foreach ($groups as $items) {
            usort($items, fn (array $a, array $b): int => $b['adjusted_delta'] <=> $a['adjusted_delta']);
            $regionPlayers = array_merge(array_slice($items, 0, 8), array_slice($items, -8));
            foreach ($regionPlayers as $player) {
                $overview[$player['player_id']] = $player;
            }
        }

        return array_values($overview);
    }

    private function confidenceLevel(float $reliability): string
    {
        return match (true) {
            $reliability >= 0.65 => 'high',
            $reliability >= 0.45 => 'medium',
            default => 'low',
        };
    }

    /**
     * @param  array<int, array<string, mixed>>  $events
     * @return array<string, mixed>|null
     */
    private function eventById(array $events, string $eventId): ?array
    {
        foreach ($events as $event) {
            if ($event['id'] === $eventId) {
                return $event;
            }
        }

        return null;
    }
}
