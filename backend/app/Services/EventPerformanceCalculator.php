<?php

namespace App\Services;

final class EventPerformanceCalculator
{
    public const METHOD_VERSION = 'event-performance-percentile-v1';

    public const RELIABILITY_K = 5;

    public const MINIMUM_MATCHES = 3;

    public const METRIC_WEIGHTS = [
        'acs' => 0.33,
        'adr' => 0.22,
        'kast' => 0.28,
        'kd' => 0.17,
    ];

    private const MINIMUM_ROLE_COHORT = 12;

    /**
     * Add role and tier benchmark percentiles plus an Event Performance Score
     * to every player-event snapshot.
     *
     * @param  array<int, array<string, mixed>>  $snapshots
     * @return array<int, array<string, mixed>>
     */
    public function scoreSnapshots(array $snapshots): array
    {
        $roleCohorts = [];
        $tierCohorts = [];

        foreach ($snapshots as $snapshot) {
            $roleKey = $this->roleCohortKey($snapshot);
            $tierKey = $this->tierCohortKey($snapshot);

            foreach (array_keys(self::METRIC_WEIGHTS) as $metric) {
                $value = (float) $snapshot[$metric];
                $roleCohorts[$roleKey][$metric][] = $value;
                $tierCohorts[$tierKey][$metric][] = $value;
            }
        }

        $preparedRoleCohorts = $this->prepareCohorts($roleCohorts);
        $preparedTierCohorts = $this->prepareCohorts($tierCohorts);

        foreach ($snapshots as &$snapshot) {
            $roleKey = $this->roleCohortKey($snapshot);
            $tierKey = $this->tierCohortKey($snapshot);
            $useRoleCohort = count($roleCohorts[$roleKey]['acs'] ?? []) >= self::MINIMUM_ROLE_COHORT;
            $cohort = $useRoleCohort
                ? $preparedRoleCohorts[$roleKey]
                : $preparedTierCohorts[$tierKey];

            $score = 0.0;
            $percentiles = [];

            foreach (self::METRIC_WEIGHTS as $metric => $weight) {
                $percentile = $this->percentileFromPreparedDistribution(
                    $cohort[$metric],
                    (float) $snapshot[$metric]
                );
                $percentiles[$metric] = round($percentile, 1);
                $score += $percentile * $weight;
            }

            $snapshot['metric_percentiles'] = $percentiles;
            $snapshot['performance_score'] = round($score, 1);
            $snapshot['benchmark_scope'] = $useRoleCohort ? 'role_tier' : 'tier_fallback';
            $snapshot['benchmark_size'] = count($cohort['acs']['values']);
        }
        unset($snapshot);

        return $snapshots;
    }

    /**
     * Calculate a winsorized empirical percentile with midpoint tie handling.
     *
     * @param  array<int, float|int>  $values
     */
    public function robustPercentile(array $values, float $value): float
    {
        return $this->percentileFromPreparedDistribution(
            $this->prepareDistribution($values),
            $value
        );
    }

    public function pairReliability(int $currentMatches, int $previousMatches): float
    {
        if ($currentMatches <= 0 || $previousMatches <= 0) {
            return 0.0;
        }

        $current = $currentMatches / ($currentMatches + self::RELIABILITY_K);
        $previous = $previousMatches / ($previousMatches + self::RELIABILITY_K);

        return sqrt($current * $previous);
    }

    /**
     * @param  array<int, float|int>  $values
     */
    public function quantile(array $values, float $percentile): float
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

        $fraction = $position - $lower;

        return $values[$lower] + (($values[$upper] - $values[$lower]) * $fraction);
    }

    /**
     * @param  array<int, float|int>  $values
     */
    public function linearSlope(array $values): float
    {
        $count = count($values);
        if ($count < 2) {
            return 0.0;
        }

        $meanX = ($count - 1) / 2;
        $meanY = array_sum($values) / $count;
        $numerator = 0.0;
        $denominator = 0.0;

        foreach (array_values($values) as $index => $value) {
            $xDelta = $index - $meanX;
            $numerator += $xDelta * ((float) $value - $meanY);
            $denominator += $xDelta ** 2;
        }

        return $denominator > 0 ? $numerator / $denominator : 0.0;
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
            fn (float $item): float => max($lower, min($upper, $item)),
            $values
        );
        sort($winsorized, SORT_NUMERIC);

        return ['values' => $winsorized, 'lower' => $lower, 'upper' => $upper];
    }

    /**
     * @param  array{values: array<int, float>, lower: float, upper: float}  $distribution
     */
    private function percentileFromPreparedDistribution(array $distribution, float $value): float
    {
        $values = $distribution['values'];
        $count = count($values);
        if ($count === 0) {
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

        return max(0.0, min(100.0, (($less + (0.5 * $equal)) / $count) * 100));
    }

    /** @param array<string, mixed> $snapshot */
    private function roleCohortKey(array $snapshot): string
    {
        return strtolower((string) $snapshot['role']).'|'.strtolower((string) $snapshot['tier']);
    }

    /** @param array<string, mixed> $snapshot */
    private function tierCohortKey(array $snapshot): string
    {
        return 'all|'.strtolower((string) $snapshot['tier']);
    }
}
