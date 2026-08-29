<?php

namespace App\Services;

final class CompetitionQualityConfig
{
    public const METHOD_VERSION = 'competition-quality-v3-stage-profile';

    public const PERFORMANCE_METHOD_VERSION = 'role-match-performance-v3-stage-profile';

    public const ELO_METHOD_VERSION = 'pre-match-elo-v1';

    public const MINIMUM_MATCHES = 20;

    public const MINIMUM_EVENTS = 2;

    public const GLOBAL_MINIMUM_MATCHES = 5;

    public const GLOBAL_MINIMUM_EVENTS = 2;

    public const RELIABILITY_K = 10;

    public const ELO_K = 32.0;

    public const MINIMUM_ROLE_COHORT = 12;

    public const STAGE_PROOF_FLOOR = 0.92;

    public const STAGE_CONFIDENCE_SCALE = 10.0;

    /** @var array<string, float> */
    public const STAGE_EVIDENCE_CAPS = [
        'vct_kickoff_triple_elim_2026' => 4.0,
        'vct_regional_groups_playins_playoffs_2026' => 4.0,
        'vct_masters_swiss_playoffs_2026' => 5.0,
        'vct_champions_groups_playoffs_2026' => 6.0,
    ];

    /** @var array<string, float> */
    public const PERFORMANCE_WEIGHTS = [
        'acs' => 0.33,
        'kast' => 0.28,
        'adr' => 0.22,
        'kd' => 0.17,
    ];

    /** @var array<string, float> */
    public const EVENT_BASES = [
        'champions' => 5.00,
        'masters' => 4.60,
        'kickoff' => 3.10,
        'regional_league' => 3.00,
        'challengers' => 2.00,
    ];

    /**
     * Expert priors only initialize low-evidence team ratings. They fade as
     * the team accumulates matches and never multiply match quality directly.
     *
     * @var array<string, float>
     */
    public const REGION_RATING_PRIORS = [
        'Americas' => 1525.0,
        'Pacific' => 1510.0,
        'EMEA' => 1500.0,
        'China' => 1485.0,
    ];

    public static function classifyEvent(string $name): ?string
    {
        $normalized = mb_strtolower($name);
        // "Valorant Champions Tour" is the circuit name, not the Champions
        // tournament. Strip it before looking for the international event.
        $normalized = (string) preg_replace(
            '/valorant champions tour(?:\s+\d{4})?/u',
            'vct',
            $normalized
        );

        return match (true) {
            str_contains($normalized, 'champions') => 'champions',
            str_contains($normalized, 'masters') => 'masters',
            str_contains($normalized, 'kickoff') => 'kickoff',
            str_contains($normalized, 'challengers') => 'challengers',
            str_contains($normalized, 'stage'), str_contains($normalized, 'regional') => 'regional_league',
            default => null,
        };
    }

    public static function eventBase(?string $competitionLevel): ?float
    {
        return $competitionLevel === null
            ? null
            : (self::EVENT_BASES[$competitionLevel] ?? null);
    }

    public static function stageFactor(?string $rawStageLabel, ?float $curatedWeight = null): float
    {
        if ($curatedWeight !== null && $curatedWeight > 0) {
            return max(0.90, min(1.15, $curatedWeight));
        }

        // CQI v3 never infers a cross-format stage from a raw label. Unknown
        // labels stay neutral and are surfaced to the curation dashboard.
        return 1.00;
    }

    public static function evidenceCap(?string $profileKey): float
    {
        return self::STAGE_EVIDENCE_CAPS[$profileKey ?? ''] ?? 4.0;
    }

    public static function saturateEvidence(float $rawEvidence, float $cap): float
    {
        if ($rawEvidence <= 0 || $cap <= 0) {
            return 0.0;
        }

        return $cap * (1.0 - exp(-$rawEvidence / $cap));
    }

    public static function stageConfidence(float $stageEvidence): float
    {
        if ($stageEvidence <= 0) {
            return 0.0;
        }

        return 1.0 - exp(-$stageEvidence / self::STAGE_CONFIDENCE_SCALE);
    }

    public static function stageProofFactor(float $stageConfidence): float
    {
        $confidence = max(0.0, min(1.0, $stageConfidence));

        return self::STAGE_PROOF_FLOOR + ((1.0 - self::STAGE_PROOF_FLOOR) * $confidence);
    }

    public static function regionPrior(?string $region): float
    {
        return self::REGION_RATING_PRIORS[$region ?? ''] ?? 1500.0;
    }

    public static function isInternational(?string $competitionLevel): bool
    {
        return in_array($competitionLevel, ['masters', 'champions'], true);
    }
}
