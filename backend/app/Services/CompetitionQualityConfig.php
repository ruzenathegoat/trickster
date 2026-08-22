<?php

namespace App\Services;

final class CompetitionQualityConfig
{
    public const METHOD_VERSION = 'competition-quality-v2';

    public const PERFORMANCE_METHOD_VERSION = 'role-match-performance-v2';

    public const ELO_METHOD_VERSION = 'pre-match-elo-v1';

    public const MINIMUM_MATCHES = 20;

    public const MINIMUM_EVENTS = 2;

    public const GLOBAL_MINIMUM_MATCHES = 5;

    public const GLOBAL_MINIMUM_EVENTS = 2;

    public const RELIABILITY_K = 10;

    public const ELO_K = 32.0;

    public const MINIMUM_ROLE_COHORT = 12;

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

        $stage = mb_strtolower((string) $rawStageLabel);

        return match (true) {
            str_contains($stage, 'grand final') => 1.10,
            str_contains($stage, 'lower final'), str_contains($stage, 'elimination') => 1.07,
            str_contains($stage, 'playoff'),
            str_contains($stage, 'quarterfinal'),
            str_contains($stage, 'semifinal'),
            str_contains($stage, 'upper'),
            str_contains($stage, 'lower') => 1.04,
            default => 1.00,
        };
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
