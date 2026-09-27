<?php

namespace App\Services;

final class CompetitionQualityConfig
{
    public const METHOD_VERSION = 'competition-quality-v3-stage-profile';

    public const PERFORMANCE_METHOD_VERSION = 'role-match-performance-v3-stage-profile';

    public const ELO_METHOD_VERSION = 'pre-match-elo-v2-dynamic-regional';

    public const MINIMUM_MATCHES = 20;

    public const MINIMUM_EVENTS = 2;

    public const GLOBAL_MINIMUM_MATCHES = 5;

    public const GLOBAL_MINIMUM_EVENTS = 2;

    public const RELIABILITY_K = 10;

    public const ELO_K = 32.0;

    public const REGIONAL_ELO_K = 16.0;

    /** Tournament stakes multipliers for adaptive ELO K-factor */
    public const STAKES_MULTIPLIERS = [
        'champions' => 1.30,
        'masters' => 1.20,
        'kickoff' => 1.10,
        'regional_league' => 1.00,
    ];

    public const MINIMUM_ROLE_COHORT = 12;

    public const STAGE_PROOF_FLOOR = 0.92;

    public const STAGE_CONFIDENCE_SCALE = 10.0;

    /** Time-decay half-life in days for match recency weighting (W_i = 2^(-Δt/45) * Q_i) */
    public const HALF_LIFE_DAYS = 45.0;

    /** Base reference match quality score (VCT Regional League baseline) */
    public const BASE_REFERENCE_QUALITY = 3.0;

    /** Strength of Schedule (SoS) role prior adjustment power alpha */
    public const SOS_POWER_ALPHA = 0.15;

    /** First Death rate (cost metric) SoS tolerance adjustment power alpha */
    public const SOS_FD_POWER_ALPHA = 0.10;

    /** Logarithmic international exposure proof bonus coefficient */
    public const INTL_PROOF_COEFFICIENT = 0.12;

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
    ];

    /**
     * Empirical Bayesian Priors per Role (VCT Tier 1 baselines).
     * Decouples player evaluation from noisy global min/max fluctuations.
     */
    public const ROLE_EMPIRICAL_PRIORS = [
        'Duelist' => [
            'acs' => ['mean' => 225.0, 'scale' => 28.0],
            'kast' => ['mean' => 71.5, 'scale' => 4.5],
            'kd' => ['mean' => 1.15, 'scale' => 0.16],
            'adr' => ['mean' => 148.0, 'scale' => 18.0],
            'fd' => ['mean' => 4.80, 'scale' => 1.40],
            'mai' => ['mean' => 72.0, 'scale' => 10.0],
        ],
        'Initiator' => [
            'acs' => ['mean' => 198.0, 'scale' => 22.0],
            'kast' => ['mean' => 74.0, 'scale' => 4.0],
            'kd' => ['mean' => 1.02, 'scale' => 0.13],
            'adr' => ['mean' => 132.0, 'scale' => 14.0],
            'fd' => ['mean' => 2.80, 'scale' => 0.90],
            'mai' => ['mean' => 74.0, 'scale' => 9.0],
        ],
        'Controller' => [
            'acs' => ['mean' => 188.0, 'scale' => 20.0],
            'kast' => ['mean' => 75.0, 'scale' => 3.8],
            'kd' => ['mean' => 0.98, 'scale' => 0.12],
            'adr' => ['mean' => 124.0, 'scale' => 13.0],
            'fd' => ['mean' => 2.50, 'scale' => 0.80],
            'mai' => ['mean' => 73.0, 'scale' => 9.0],
        ],
        'Sentinel' => [
            'acs' => ['mean' => 192.0, 'scale' => 21.0],
            'kast' => ['mean' => 74.5, 'scale' => 4.0],
            'kd' => ['mean' => 1.02, 'scale' => 0.13],
            'adr' => ['mean' => 128.0, 'scale' => 14.0],
            'fd' => ['mean' => 2.60, 'scale' => 0.85],
            'mai' => ['mean' => 72.0, 'scale' => 9.5],
        ],
        'Flex' => [
            'acs' => ['mean' => 198.0, 'scale' => 23.0],
            'kast' => ['mean' => 73.8, 'scale' => 4.2],
            'kd' => ['mean' => 1.04, 'scale' => 0.14],
            'adr' => ['mean' => 132.0, 'scale' => 15.0],
            'fd' => ['mean' => 3.00, 'scale' => 1.00],
            'mai' => ['mean' => 73.0, 'scale' => 9.0],
        ],
    ];

    /** Bayesian Shrinkage parameter (in matches equivalent) */
    public const BAYESIAN_KAPPA_MATCHES = 5.0;

    /** Bayesian Shrinkage parameter (in individual maps count equivalent: ~4-5 series x 2.5 maps) */
    public const BAYESIAN_KAPPA_MAPS = 12.0;

    /** Prior dispersion (standard deviation) for professional consistency */
    public const BAYESIAN_PRIOR_DISPERSION = 30.0;

    /** Prior degrees of freedom weight for consistency variance shrinkage */
    public const BAYESIAN_CONSISTENCY_NU0 = 8.0;

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
        // Exclude Challengers events
        if (str_contains($normalized, 'challengers')) {
            return null;
        }

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
            str_contains($normalized, 'stage'), str_contains($normalized, 'regional') => 'regional_league',
            default => null,
        };
    }

    public static function eventBase(?string $competitionLevel): ?float
    {
        if ($competitionLevel === 'challengers') {
            return null;
        }

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

    public static function stakesMultiplier(?string $competitionLevel): float
    {
        return self::STAKES_MULTIPLIERS[$competitionLevel ?? ''] ?? 1.00;
    }

    public static function marginMultiplier(int $mapsPlayed, ?int $bestOf = 3): float
    {
        if ($bestOf === 5) {
            return match ($mapsPlayed) {
                3 => 1.30, // 3-0 sweep
                4 => 1.05, // 3-1 win
                5 => 0.85, // 3-2 close
                default => 1.00,
            };
        }

        return match ($mapsPlayed) {
            2 => 1.20, // 2-0 sweep
            3 => 0.85, // 2-1 close
            default => 1.00,
        };
    }

    /**
     * Exponential time-decay factor based on match recency (45-day half life).
     * W_decay = 2^(-Δt / 45.0)
     */
    public static function timeDecayFactor(string|\DateTimeInterface|null $matchDate, ?\DateTimeInterface $referenceDate = null): float
    {
        if ($matchDate === null) {
            return 1.0;
        }

        try {
            $mDate = $matchDate instanceof \DateTimeInterface
                ? $matchDate
                : new \DateTime((string) $matchDate);
            $ref = $referenceDate ?? new \DateTime();

            $diffDays = (float) max(0, $ref->diff($mDate)->days);
            if ($mDate > $ref) {
                return 1.0;
            }

            return max(0.001, min(1.0, pow(2.0, -($diffDays / self::HALF_LIFE_DAYS))));
        } catch (\Throwable) {
            return 1.0;
        }
    }

    /**
     * Strength of schedule adjustment factor.
     * > 1.0 for Champions / Masters competition, < 1.0 for low-tier competition.
     */
    public static function sosAdjustmentFactor(float $averageQuality): float
    {
        $q = max(0.5, $averageQuality);

        return pow($q / self::BASE_REFERENCE_QUALITY, self::SOS_POWER_ALPHA);
    }

    /**
     * Return empirical role priors dynamically adjusted for Strength of Schedule.
     * Benefit metrics (ACS, KD, ADR, KAST) scale inversely with difficulty (lower required baseline against Sentinels/PRX).
     * Cost metrics (First Death Rate) scale directly with difficulty (higher tolerance against elite aimers).
     *
     * @return array<string, array{mean: float, scale: float}>
     */
    public static function sosAdjustedRolePriors(?string $role, float $averageQuality): array
    {
        $role = $role ?? 'Flex';
        $base = self::ROLE_EMPIRICAL_PRIORS[$role] ?? self::ROLE_EMPIRICAL_PRIORS['Flex'];
        $sosFactor = self::sosAdjustmentFactor($averageQuality);
        $fdSosFactor = pow(max(0.5, $averageQuality) / self::BASE_REFERENCE_QUALITY, self::SOS_FD_POWER_ALPHA);

        return [
            'acs' => [
                'mean' => round($base['acs']['mean'] / $sosFactor, 2),
                'scale' => $base['acs']['scale'],
            ],
            'kast' => [
                'mean' => round($base['kast']['mean'] / $sosFactor, 2),
                'scale' => $base['kast']['scale'],
            ],
            'kd' => [
                'mean' => round($base['kd']['mean'] / $sosFactor, 3),
                'scale' => $base['kd']['scale'],
            ],
            'adr' => [
                'mean' => round($base['adr']['mean'] / $sosFactor, 2),
                'scale' => $base['adr']['scale'],
            ],
            'fd' => [
                'mean' => round($base['fd']['mean'] * $fdSosFactor, 3),
                'scale' => $base['fd']['scale'],
            ],
            'mai' => [
                'mean' => round($base['mai']['mean'] / $sosFactor, 2),
                'scale' => $base['mai']['scale'],
            ],
        ];
    }

    /**
     * Logarithmic uncapped international proof bonus for sustained world-stage appearances.
     * Bonus = log10(1 + N_intl) * 0.12
     */
    public static function intlProofBonus(int $intlMatches): float
    {
        if ($intlMatches <= 0) {
            return 0.0;
        }

        return log10(1.0 + (float) $intlMatches) * self::INTL_PROOF_COEFFICIENT;
    }

    /**
     * Compute composite Z-Score deviation vs role empirical prior baseline.
     * Positive = performs above role average (e.g. +1.12σ).
     */
    public static function calculateRoleDelta(?string $role, ?float $acs, ?float $kd, ?float $adr, ?float $kast, ?float $averageQuality = null): float
    {
        $role = $role ?? 'Flex';
        $prior = ($averageQuality !== null && $averageQuality > 0)
            ? self::sosAdjustedRolePriors($role, $averageQuality)
            : (self::ROLE_EMPIRICAL_PRIORS[$role] ?? self::ROLE_EMPIRICAL_PRIORS['Flex']);

        $zAcs = $acs !== null ? ($acs - $prior['acs']['mean']) / $prior['acs']['scale'] : 0.0;
        $zKd = $kd !== null ? ($kd - $prior['kd']['mean']) / $prior['kd']['scale'] : 0.0;
        $zAdr = $adr !== null ? ($adr - $prior['adr']['mean']) / $prior['adr']['scale'] : 0.0;
        $zKast = $kast !== null ? ($kast - $prior['kast']['mean']) / $prior['kast']['scale'] : 0.0;

        return round((0.33 * $zAcs) + (0.28 * $zKast) + (0.22 * $zAdr) + (0.17 * $zKd), 2);
    }
}
