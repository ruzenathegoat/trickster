<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

final class CompetitionQualityService
{
    public function __construct(
        private readonly HistoricalMatchContextService $historicalContext,
        private readonly PreMatchEloCalculator $eloCalculator,
    ) {}

    /**
     * Rebuild every CQI v2 component for one season with a fixed number of
     * bulk queries. No query is executed inside a player or match loop.
     *
     * @return array<string, mixed>
     */
    public function recalculateSeason(int $season): array
    {
        $contextSummary = $this->historicalContext->backfillAll();
        $classifiedEvents = $this->classifyEvents();
        $matches = $this->loadMatches($season);
        $calculatedAt = now();

        if ($matches === []) {
            $this->persist($season, [], [], [], [], $calculatedAt);

            return [
                'season' => $season,
                'matches' => 0,
                'players' => 0,
                'eligible_players' => 0,
                'classified_events' => $classifiedEvents,
                'context' => $contextSummary,
                'method_version' => CompetitionQualityConfig::METHOD_VERSION,
            ];
        }

        $ratingRows = $this->eloCalculator->calculate($matches, $season);
        [$qualityRows, $qualityByMatchTeam] = $this->buildMatchQuality(
            $matches,
            $ratingRows,
            $season
        );
        $observations = $this->loadPlayerObservations($season, $qualityByMatchTeam);
        $performanceRows = $this->scoreMatchPerformance($observations, $season);
        $competitionRows = $this->aggregatePlayers($performanceRows, $season);

        $this->persist(
            $season,
            $ratingRows,
            $qualityRows,
            $performanceRows,
            $competitionRows,
            $calculatedAt
        );

        return [
            'season' => $season,
            'matches' => count($matches),
            'player_match_observations' => count($performanceRows),
            'players' => count($competitionRows),
            'eligible_players' => count(array_filter(
                $competitionRows,
                fn (array $row): bool => (float) $row['confidence'] >= 1.0
            )),
            'classified_events' => $classifiedEvents,
            'context' => $contextSummary,
            'method_version' => CompetitionQualityConfig::METHOD_VERSION,
        ];
    }

    public function latestSeason(): ?int
    {
        $date = DB::table('matches')
            ->whereNotNull('winner_team_id')
            ->whereNotNull('match_date')
            ->max('match_date');

        return $date === null ? null : (int) substr((string) $date, 0, 4);
    }

    private function classifyEvents(): int
    {
        $events = DB::table('events')->select('id', 'name')->get();
        $rows = [];

        foreach ($events as $event) {
            $level = CompetitionQualityConfig::classifyEvent((string) $event->name);
            $rows[] = [
                'id' => $event->id,
                'competition_level' => $level,
                'competition_base_weight' => CompetitionQualityConfig::eventBase($level),
            ];
        }

        // update() would cause one query per event. A single PostgreSQL upsert
        // cannot omit required event columns, so use one CASE update instead.
        if ($rows === []) {
            return 0;
        }

        $levelCases = [];
        $weightCases = [];
        $levelBindings = [];
        $weightBindings = [];
        $ids = [];
        foreach ($rows as $row) {
            $levelCases[] = 'WHEN id = ? THEN ?';
            $levelBindings[] = $row['id'];
            $levelBindings[] = $row['competition_level'];
            $weightCases[] = 'WHEN id = ? THEN ?';
            $weightBindings[] = $row['id'];
            $weightBindings[] = $row['competition_base_weight'];
            $ids[] = $row['id'];
        }

        $placeholders = implode(', ', array_fill(0, count($ids), '?'));
        $bindings = array_merge($levelBindings, $weightBindings, $ids);
        DB::update(
            'UPDATE events SET competition_level = CASE '.implode(' ', $levelCases).
            ' ELSE competition_level END, competition_base_weight = CASE '.
            implode(' ', $weightCases).' ELSE competition_base_weight END WHERE id IN ('.$placeholders.')',
            $bindings
        );

        return count(array_filter(
            $rows,
            fn (array $row): bool => $row['competition_level'] !== null
        ));
    }

    /** @return array<int, array<string, mixed>> */
    private function loadMatches(int $season): array
    {
        return DB::table('matches as m')
            ->join('events as e', 'e.id', '=', 'm.event_id')
            ->leftJoin('stage_label_mapping as slm', 'slm.id', '=', 'm.stage_label_id')
            ->whereYear('m.match_date', $season)
            ->whereNotNull('m.winner_team_id')
            ->whereNotNull('e.competition_level')
            ->whereNotNull('e.competition_base_weight')
            ->select([
                'm.id',
                'm.event_id',
                'm.team_a_id',
                'm.team_b_id',
                'm.winner_team_id',
                'm.match_date',
                'm.raw_stage_label',
                'e.name as event_name',
                'e.region as event_region',
                'e.competition_level',
                'e.competition_base_weight',
                'slm.pressure_weight',
            ])
            ->orderBy('m.match_date')
            ->orderBy('m.id')
            ->get()
            ->map(fn (object $match): array => (array) $match)
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $matches
     * @param  array<int, array<string, mixed>>  $ratingRows
     * @return array{0: array<int, array<string, mixed>>, 1: array<string, array<string, mixed>>}
     */
    private function buildMatchQuality(array $matches, array $ratingRows, int $season): array
    {
        $ratings = [];
        foreach ($ratingRows as $row) {
            $ratings[$this->matchTeamKey($row['match_id'], $row['team_id'])] = $row;
        }

        $rows = [];
        $byMatchTeam = [];
        foreach ($matches as $match) {
            foreach ([
                [(string) $match['team_a_id'], (string) $match['team_b_id']],
                [(string) $match['team_b_id'], (string) $match['team_a_id']],
            ] as [$teamId, $opponentId]) {
                $opponentRating = $ratings[$this->matchTeamKey($match['id'], $opponentId)] ?? null;
                $ratingPercentile = (float) ($opponentRating['rating_percentile'] ?? 0.5);
                $ratingConfidence = (float) ($opponentRating['rating_confidence'] ?? 0.0);
                $evidenceBlend = 0.35 + (0.65 * $ratingConfidence);
                $adjustedPercentile = 0.5 + ($evidenceBlend * ($ratingPercentile - 0.5));
                $opponentFactor = 0.85 + (0.30 * $adjustedPercentile);
                $eventBase = (float) $match['competition_base_weight'];
                $stageFactor = CompetitionQualityConfig::stageFactor(
                    $match['raw_stage_label'],
                    $match['pressure_weight'] === null ? null : (float) $match['pressure_weight']
                );
                $quality = $eventBase * $stageFactor * $opponentFactor;

                $row = [
                    'match_id' => $match['id'],
                    'team_id' => $teamId,
                    'opponent_id' => $opponentId,
                    'season' => $season,
                    'competition_level' => $match['competition_level'],
                    'event_base' => round($eventBase, 4),
                    'stage_factor' => round($stageFactor, 4),
                    'opponent_factor' => round($opponentFactor, 4),
                    'match_quality' => round($quality, 4),
                    'method_version' => CompetitionQualityConfig::METHOD_VERSION,
                ];
                $rows[] = $row;
                $byMatchTeam[$this->matchTeamKey($match['id'], $teamId)] = $row;
            }
        }

        return [$rows, $byMatchTeam];
    }

    /**
     * @param  array<string, array<string, mixed>>  $qualityByMatchTeam
     * @return array<int, array<string, mixed>>
     */
    private function loadPlayerObservations(int $season, array $qualityByMatchTeam): array
    {
        $rows = DB::table('player_map_stats as pms')
            ->join('maps as mp', 'mp.id', '=', 'pms.map_id')
            ->join('matches as m', 'm.id', '=', 'pms.match_id')
            ->join('events as e', 'e.id', '=', 'm.event_id')
            ->where('mp.map_name', 'All Maps')
            ->whereYear('m.match_date', $season)
            ->whereNotNull('m.winner_team_id')
            ->whereNotNull('pms.team_id_at_match')
            ->whereNotNull('pms.acs')
            ->where('pms.acs', '>', 0)
            ->whereNotNull('e.competition_level')
            ->select([
                'pms.id as stat_id',
                'pms.player_id',
                'pms.match_id',
                'pms.team_id_at_match as team_id',
                'pms.role_at_match as role',
                'pms.acs',
                'pms.adr',
                'pms.kast',
                'pms.kills',
                'pms.deaths',
                'm.event_id',
                'e.competition_level',
            ])
            ->orderByDesc('pms.id')
            ->get();

        $seen = [];
        $observations = [];
        foreach ($rows as $row) {
            $playerMatchKey = (string) $row->player_id.'|'.(string) $row->match_id;
            if (isset($seen[$playerMatchKey])) {
                continue;
            }

            $quality = $qualityByMatchTeam[$this->matchTeamKey($row->match_id, $row->team_id)] ?? null;
            if ($quality === null) {
                continue;
            }

            $seen[$playerMatchKey] = true;
            $deaths = (int) $row->deaths;
            $kills = (int) $row->kills;
            $observations[] = [
                'player_id' => $row->player_id,
                'match_id' => $row->match_id,
                'event_id' => $row->event_id,
                'team_id' => $row->team_id,
                'opponent_id' => $quality['opponent_id'],
                'role' => $row->role ?: 'Flex',
                'competition_level' => $row->competition_level,
                'acs' => (float) $row->acs,
                'adr' => (float) ($row->adr ?? 0),
                'kast' => (float) ($row->kast ?? 0),
                'kd' => $deaths > 0 ? $kills / $deaths : (float) $kills,
                'match_quality' => (float) $quality['match_quality'],
            ];
        }

        return $observations;
    }

    /**
     * @param  array<int, array<string, mixed>>  $observations
     * @return array<int, array<string, mixed>>
     */
    private function scoreMatchPerformance(array $observations, int $season): array
    {
        $roleCohorts = [];
        $levelCohorts = [];
        foreach ($observations as $observation) {
            $roleKey = $this->roleLevelKey($observation['role'], $observation['competition_level']);
            $levelKey = strtolower((string) $observation['competition_level']);
            foreach (array_keys(CompetitionQualityConfig::PERFORMANCE_WEIGHTS) as $metric) {
                $roleCohorts[$roleKey][$metric][] = (float) $observation[$metric];
                $levelCohorts[$levelKey][$metric][] = (float) $observation[$metric];
            }
        }

        $preparedRoles = $this->prepareCohorts($roleCohorts);
        $preparedLevels = $this->prepareCohorts($levelCohorts);
        $rows = [];
        foreach ($observations as $observation) {
            $roleKey = $this->roleLevelKey($observation['role'], $observation['competition_level']);
            $levelKey = strtolower((string) $observation['competition_level']);
            $useRole = count($roleCohorts[$roleKey]['acs'] ?? []) >= CompetitionQualityConfig::MINIMUM_ROLE_COHORT;
            $cohort = $useRole ? $preparedRoles[$roleKey] : $preparedLevels[$levelKey];
            $percentiles = [];
            $utility = 0.0;

            foreach (CompetitionQualityConfig::PERFORMANCE_WEIGHTS as $metric => $weight) {
                $percentile = $this->percentile($cohort[$metric], (float) $observation[$metric]);
                $percentiles[$metric] = $percentile;
                $utility += $percentile * $weight;
            }

            $rows[] = [
                'player_id' => $observation['player_id'],
                'match_id' => $observation['match_id'],
                'event_id' => $observation['event_id'],
                'team_id' => $observation['team_id'],
                'opponent_id' => $observation['opponent_id'],
                'season' => $season,
                'role' => $observation['role'],
                'competition_level' => $observation['competition_level'],
                'acs_percentile' => round($percentiles['acs'], 3),
                'adr_percentile' => round($percentiles['adr'], 3),
                'kast_percentile' => round($percentiles['kast'], 3),
                'kd_percentile' => round($percentiles['kd'], 3),
                'performance_utility' => round($utility, 3),
                'match_quality' => round((float) $observation['match_quality'], 4),
                'weighted_contribution' => round($utility * (float) $observation['match_quality'], 4),
                'method_version' => CompetitionQualityConfig::PERFORMANCE_METHOD_VERSION,
            ];
        }

        return $rows;
    }

    /**
     * @param  array<int, array<string, mixed>>  $performanceRows
     * @return array<int, array<string, mixed>>
     */
    private function aggregatePlayers(array $performanceRows, int $season): array
    {
        $groups = [];
        foreach ($performanceRows as $row) {
            $groups[(string) $row['player_id']][] = $row;
        }

        $aggregates = [];
        foreach ($groups as $playerId => $rows) {
            $matches = count($rows);
            $events = count(array_unique(array_column($rows, 'event_id')));
            $internationalRows = array_values(array_filter(
                $rows,
                fn (array $row): bool => CompetitionQualityConfig::isInternational($row['competition_level'])
            ));
            $internationalEvents = count(array_unique(array_column($internationalRows, 'event_id')));
            $qualitySum = array_sum(array_column($rows, 'match_quality'));
            $weightedSum = array_sum(array_column($rows, 'weighted_contribution'));
            $reliability = ($matches / ($matches + CompetitionQualityConfig::RELIABILITY_K))
                * min(1.0, $events / CompetitionQualityConfig::MINIMUM_EVENTS);
            $weightedRaw = $qualitySum > 0 ? $weightedSum / $qualitySum : 50.0;
            $weightedPerformance = 50.0 + ($reliability * ($weightedRaw - 50.0));
            $eligible = $matches >= CompetitionQualityConfig::MINIMUM_MATCHES
                && $events >= CompetitionQualityConfig::MINIMUM_EVENTS;

            $aggregates[$playerId] = [
                'player_id' => $playerId,
                'performance_dispersion' => $this->sampleDeviation(array_column($rows, 'performance_utility')),
                'cqi_raw' => $matches > 0 ? $qualitySum / $matches : null,
                'weighted_performance' => $weightedPerformance,
                'total_matches' => $matches,
                'event_count' => $events,
                'international_matches' => count($internationalRows),
                'international_events' => $internationalEvents,
                'reliability' => $reliability,
                'eligible' => $eligible,
            ];
        }

        $eligible = array_values(array_filter($aggregates, fn (array $row): bool => $row['eligible']));
        $medianCqi = $this->quantile(
            array_values(array_filter(array_column($eligible, 'cqi_raw'), fn ($value): bool => $value !== null)),
            0.5
        );
        if ($eligible === []) {
            $medianCqi = $this->quantile(
                array_values(array_filter(array_column($aggregates, 'cqi_raw'), fn ($value): bool => $value !== null)),
                0.5
            );
        }

        foreach ($aggregates as &$aggregate) {
            $raw = $aggregate['cqi_raw'] ?? $medianCqi;
            $aggregate['cqi_adjusted'] = $medianCqi
                + ($aggregate['reliability'] * ($raw - $medianCqi));
        }
        unset($aggregate);

        $dispersionPopulation = array_values(array_filter(
            array_column($eligible, 'performance_dispersion'),
            fn ($value): bool => $value !== null
        ));
        $cqiPopulation = array_column(
            array_values(array_filter($aggregates, fn (array $row): bool => $row['eligible'])),
            'cqi_adjusted'
        );
        if ($dispersionPopulation === []) {
            $dispersionPopulation = array_values(array_filter(
                array_column($aggregates, 'performance_dispersion'),
                fn ($value): bool => $value !== null
            ));
        }
        if ($cqiPopulation === []) {
            $cqiPopulation = array_column($aggregates, 'cqi_adjusted');
        }

        $dispersionDistribution = $this->prepareDistribution($dispersionPopulation);
        $cqiDistribution = $this->prepareDistribution($cqiPopulation);
        $result = [];
        foreach ($aggregates as $aggregate) {
            $sampleConfidence = min(1.0, $aggregate['total_matches'] / CompetitionQualityConfig::MINIMUM_MATCHES)
                * min(1.0, $aggregate['event_count'] / CompetitionQualityConfig::MINIMUM_EVENTS);
            $consistency = $aggregate['performance_dispersion'] === null
                ? 50.0
                : 100.0 - $this->percentile(
                    $dispersionDistribution,
                    (float) $aggregate['performance_dispersion']
                );
            $cqi = $this->percentile($cqiDistribution, (float) $aggregate['cqi_adjusted']);

            if (! $aggregate['eligible']) {
                $consistency = 50.0 + ($sampleConfidence * ($consistency - 50.0));
                $cqi = 50.0 + ($sampleConfidence * ($cqi - 50.0));
            }

            $weightedPerformance = max(0.0, min(100.0, (float) $aggregate['weighted_performance']));
            $consistency = max(0.0, min(100.0, $consistency));
            $cqi = max(0.0, min(100.0, $cqi));
            $proven = ($consistency * $cqi * $weightedPerformance) ** (1 / 3);
            $validationStatus = match (true) {
                $aggregate['eligible']
                    && $aggregate['international_matches'] >= CompetitionQualityConfig::GLOBAL_MINIMUM_MATCHES
                    && $aggregate['international_events'] >= CompetitionQualityConfig::GLOBAL_MINIMUM_EVENTS => 'globally_verified',
                $aggregate['eligible'] => 'regionally_verified',
                $aggregate['international_matches'] > 0 => 'global_provisional',
                default => 'limited_evidence',
            };

            $result[] = [
                'player_id' => $aggregate['player_id'],
                'season' => $season,
                'performance_dispersion' => $aggregate['performance_dispersion'] === null
                    ? null
                    : round((float) $aggregate['performance_dispersion'], 4),
                'consistency_percentile' => round($consistency, 3),
                'cqi_raw' => round((float) $aggregate['cqi_raw'], 4),
                'cqi_adjusted' => round((float) $aggregate['cqi_adjusted'], 4),
                'cqi_percentile' => round($cqi, 3),
                'weighted_performance' => round($weightedPerformance, 3),
                'proven_consistency' => round($proven, 3),
                'total_matches' => $aggregate['total_matches'],
                'event_count' => $aggregate['event_count'],
                'international_matches' => $aggregate['international_matches'],
                'international_events' => $aggregate['international_events'],
                'confidence' => $aggregate['eligible'] ? 1.0 : round($sampleConfidence, 4),
                'validation_status' => $validationStatus,
                'method_version' => CompetitionQualityConfig::METHOD_VERSION,
            ];
        }

        return $result;
    }

    /**
     * @param  array<int, array<string, mixed>>  $ratingRows
     * @param  array<int, array<string, mixed>>  $qualityRows
     * @param  array<int, array<string, mixed>>  $performanceRows
     * @param  array<int, array<string, mixed>>  $competitionRows
     */
    private function persist(
        int $season,
        array $ratingRows,
        array $qualityRows,
        array $performanceRows,
        array $competitionRows,
        mixed $calculatedAt
    ): void {
        $ratingRows = $this->withCalculatedAt($ratingRows, $calculatedAt);
        $qualityRows = $this->withCalculatedAt($qualityRows, $calculatedAt);
        $performanceRows = $this->withCalculatedAt($performanceRows, $calculatedAt);
        $competitionRows = $this->withCalculatedAt($competitionRows, $calculatedAt);

        DB::transaction(function () use (
            $season,
            $ratingRows,
            $qualityRows,
            $performanceRows,
            $competitionRows
        ): void {
            DB::table('player_match_quality_metrics')->where('season', $season)->delete();
            DB::table('player_competition_metrics')->where('season', $season)->delete();
            DB::table('match_team_quality_scores')->where('season', $season)->delete();
            DB::table('team_rating_snapshots')->where('season', $season)->delete();

            $this->insertChunks('team_rating_snapshots', $ratingRows);
            $this->insertChunks('match_team_quality_scores', $qualityRows);
            $this->insertChunks('player_match_quality_metrics', $performanceRows);
            $this->insertChunks('player_competition_metrics', $competitionRows);

            if ($competitionRows !== []) {
                DB::statement(<<<'SQL'
                    UPDATE players p
                    SET
                        consistency_index = CASE
                            WHEN pcm.confidence >= 1 THEN pcm.consistency_percentile
                            ELSE NULL
                        END,
                        consistency_provisional_index = pcm.consistency_percentile,
                        consistency_sample_size = pcm.total_matches,
                        consistency_event_count = pcm.event_count,
                        consistency_method = pcm.method_version,
                        consistency_calculated_at = pcm.calculated_at,
                        competition_quality_index = pcm.cqi_percentile
                    FROM player_competition_metrics pcm
                    WHERE pcm.player_id = p.id
                      AND pcm.season = ?
                SQL, [$season]);
            }
        });
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function insertChunks(string $table, array $rows): void
    {
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table($table)->insert($chunk);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function withCalculatedAt(array $rows, mixed $calculatedAt): array
    {
        return array_map(function (array $row) use ($calculatedAt): array {
            $row['calculated_at'] = $calculatedAt;

            return $row;
        }, $rows);
    }

    /**
     * @param  array<string, array<string, array<int, float>>>  $cohorts
     * @return array<string, array<string, array{values: array<int, float>, lower: float, upper: float}>>
     */
    private function prepareCohorts(array $cohorts): array
    {
        $prepared = [];
        foreach ($cohorts as $key => $metrics) {
            foreach ($metrics as $metric => $values) {
                $prepared[$key][$metric] = $this->prepareDistribution($values);
            }
        }

        return $prepared;
    }

    /**
     * @param  array<int, float|int>  $values
     * @return array{values: array<int, float>, lower: float, upper: float}
     */
    private function prepareDistribution(array $values): array
    {
        $values = array_map('floatval', $values);
        sort($values, SORT_NUMERIC);
        if ($values === []) {
            return ['values' => [], 'lower' => 0.0, 'upper' => 0.0];
        }

        $lower = $this->quantile($values, 0.05);
        $upper = $this->quantile($values, 0.95);
        $winsorized = array_map(
            fn (float $value): float => max($lower, min($upper, $value)),
            $values
        );
        sort($winsorized, SORT_NUMERIC);

        return ['values' => $winsorized, 'lower' => $lower, 'upper' => $upper];
    }

    /** @param array{values: array<int, float>, lower: float, upper: float} $distribution */
    private function percentile(array $distribution, float $value): float
    {
        $values = $distribution['values'];
        if ($values === []) {
            return 50.0;
        }

        $value = max($distribution['lower'], min($distribution['upper'], $value));
        $less = 0;
        $equal = 0;
        foreach ($values as $candidate) {
            if ($candidate < $value - 0.000001) {
                $less++;
            } elseif (abs($candidate - $value) <= 0.000001) {
                $equal++;
            }
        }

        return (($less + (0.5 * $equal)) / count($values)) * 100;
    }

    /** @param array<int, float|int> $values */
    private function quantile(array $values, float $percentile): float
    {
        if ($values === []) {
            return 0.0;
        }

        $values = array_map('floatval', $values);
        sort($values, SORT_NUMERIC);
        $position = (count($values) - 1) * max(0.0, min(1.0, $percentile));
        $lower = (int) floor($position);
        $upper = (int) ceil($position);
        if ($lower === $upper) {
            return $values[$lower];
        }

        return $values[$lower] + (($values[$upper] - $values[$lower]) * ($position - $lower));
    }

    /** @param array<int, float|int> $values */
    private function sampleDeviation(array $values): ?float
    {
        if (count($values) < 2) {
            return null;
        }

        $prepared = $this->prepareDistribution($values);
        $winsorized = $prepared['values'];
        $mean = array_sum($winsorized) / count($winsorized);
        $sum = 0.0;
        foreach ($winsorized as $value) {
            $sum += ($value - $mean) ** 2;
        }

        return sqrt($sum / (count($winsorized) - 1));
    }

    private function matchTeamKey(mixed $matchId, mixed $teamId): string
    {
        return (string) $matchId.'|'.(string) $teamId;
    }

    private function roleLevelKey(mixed $role, mixed $level): string
    {
        return mb_strtolower((string) $role).'|'.mb_strtolower((string) $level);
    }
}
