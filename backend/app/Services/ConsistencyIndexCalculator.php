<?php

namespace App\Services;

final class ConsistencyIndexCalculator
{
    public const MINIMUM_SAMPLE_SIZE = 20;

    public const MINIMUM_EVENT_COUNT = 2;

    public const METHOD = 'winsorized-sample-cv-v2';

    private const LOWER_PERCENTILE = 0.05;

    private const UPPER_PERCENTILE = 0.95;

    /**
     * Calculate CI from one completed-match ACS observation per player.
     *
     * Invalid/non-positive ACS values are excluded before eligibility is
     * evaluated. Eligible samples are winsorized at P5/P95, then measured
     * with sample standard deviation (N - 1) and coefficient of variation.
     *
     * @return array{
     *     value: float|null,
     *     provisional_value: float|null,
     *     sample_size: int,
     *     event_count: int,
     *     eligible: bool,
     *     mean: float|null,
     *     standard_deviation: float|null,
     *     coefficient_of_variation: float|null,
     *     method: string,
     *     ineligibility_reason: string|null
     * }
     */
    public function calculate(iterable $rawSamples, int $distinctEventCount): array
    {
        $samples = [];

        foreach ($rawSamples as $sample) {
            if (! is_numeric($sample)) {
                continue;
            }

            $value = (float) $sample;
            if (! is_finite($value) || $value <= 0) {
                continue;
            }

            $samples[] = $value;
        }

        sort($samples, SORT_NUMERIC);

        $sampleSize = count($samples);
        $baseResult = [
            'value' => null,
            'provisional_value' => null,
            'sample_size' => $sampleSize,
            'event_count' => $distinctEventCount,
            'eligible' => false,
            'mean' => null,
            'standard_deviation' => null,
            'coefficient_of_variation' => null,
            'method' => self::METHOD,
            'ineligibility_reason' => null,
        ];

        $ineligibilityReason = match (true) {
            $sampleSize < self::MINIMUM_SAMPLE_SIZE => 'minimum_valid_matches_not_met',
            $distinctEventCount < self::MINIMUM_EVENT_COUNT => 'minimum_distinct_events_not_met',
            default => null,
        };

        // Sample standard deviation is undefined for fewer than two observations.
        if ($sampleSize < 2) {
            return array_merge($baseResult, [
                'ineligibility_reason' => $ineligibilityReason,
            ]);
        }

        $winsorized = $this->winsorize($samples);
        $mean = array_sum($winsorized) / $sampleSize;

        if ($mean <= 0) {
            return array_merge($baseResult, [
                'ineligibility_reason' => 'non_positive_mean',
            ]);
        }

        $squaredDeviations = array_reduce(
            $winsorized,
            static fn (float $carry, float $value): float => $carry + (($value - $mean) ** 2),
            0.0,
        );

        $standardDeviation = sqrt($squaredDeviations / ($sampleSize - 1));
        $coefficientOfVariation = $standardDeviation / $mean;
        $value = max(0.0, min(100.0, 100.0 * (1.0 - $coefficientOfVariation)));

        $roundedValue = round($value, 2);

        return [
            'value' => $ineligibilityReason === null ? $roundedValue : null,
            'provisional_value' => $roundedValue,
            'sample_size' => $sampleSize,
            'event_count' => $distinctEventCount,
            'eligible' => $ineligibilityReason === null,
            'mean' => round($mean, 4),
            'standard_deviation' => round($standardDeviation, 4),
            'coefficient_of_variation' => round($coefficientOfVariation, 6),
            'method' => self::METHOD,
            'ineligibility_reason' => $ineligibilityReason,
        ];
    }

    /** @param list<float> $sortedSamples */
    private function winsorize(array $sortedSamples): array
    {
        $lowerBound = $this->percentile($sortedSamples, self::LOWER_PERCENTILE);
        $upperBound = $this->percentile($sortedSamples, self::UPPER_PERCENTILE);

        return array_map(
            static fn (float $value): float => max($lowerBound, min($upperBound, $value)),
            $sortedSamples,
        );
    }

    /** @param list<float> $sortedSamples */
    private function percentile(array $sortedSamples, float $percentile): float
    {
        $lastIndex = count($sortedSamples) - 1;
        $position = $lastIndex * $percentile;
        $lowerIndex = (int) floor($position);
        $upperIndex = (int) ceil($position);

        if ($lowerIndex === $upperIndex) {
            return $sortedSamples[$lowerIndex];
        }

        $fraction = $position - $lowerIndex;

        return $sortedSamples[$lowerIndex]
            + (($sortedSamples[$upperIndex] - $sortedSamples[$lowerIndex]) * $fraction);
    }
}
