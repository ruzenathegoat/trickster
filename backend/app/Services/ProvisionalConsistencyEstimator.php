<?php

namespace App\Services;

final class ProvisionalConsistencyEstimator
{
    /**
     * Shrink an under-sampled CI observation towards the verified cohort median.
     *
     * @return array{value: float, confidence: float, is_provisional: bool}
     */
    public function estimate(
        ?float $officialValue,
        ?float $provisionalValue,
        int $sampleSize,
        int $eventCount,
        float $cohortMedian,
    ): array {
        $isVerified = $officialValue !== null
            && $sampleSize >= ConsistencyIndexCalculator::MINIMUM_SAMPLE_SIZE
            && $eventCount >= ConsistencyIndexCalculator::MINIMUM_EVENT_COUNT;

        if ($isVerified) {
            return [
                'value' => $this->clamp($officialValue),
                'confidence' => 1.0,
                'is_provisional' => false,
            ];
        }

        $sampleConfidence = min(max($sampleSize, 0) / ConsistencyIndexCalculator::MINIMUM_SAMPLE_SIZE, 1.0);
        $eventConfidence = min(max($eventCount, 0) / ConsistencyIndexCalculator::MINIMUM_EVENT_COUNT, 1.0);
        $confidence = $sampleConfidence * $eventConfidence;
        $median = $this->clamp($cohortMedian);
        $observed = $provisionalValue === null ? $median : $this->clamp($provisionalValue);

        return [
            'value' => round(($confidence * $observed) + ((1 - $confidence) * $median), 2),
            'confidence' => round($confidence, 4),
            'is_provisional' => true,
        ];
    }

    private function clamp(float $value): float
    {
        return max(0.0, min(100.0, $value));
    }
}
