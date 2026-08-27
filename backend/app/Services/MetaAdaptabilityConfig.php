<?php

namespace App\Services;

final class MetaAdaptabilityConfig
{
    public const METHOD_VERSION = 'meta-adaptability-v2';

    public const MINIMUM_MAPS_PER_PATCH = 3;

    public const MINIMUM_MAPS = 15;

    public const HIGH_CONFIDENCE_MAPS = 30;

    public const MINIMUM_ACTIVE_PATCHES = 2;

    public const HIGH_CONFIDENCE_PATCHES = 3;

    public const MINIMUM_META_SHIFT = 12.5;

    public const MINIMUM_COVERAGE = 0.60;

    public const HIGH_CONFIDENCE_COVERAGE = 0.80;

    public const COMPONENT_WEIGHTS = [
        'meta_alignment' => 0.45,
        'performance_retention' => 0.25,
        'meta_response' => 0.20,
        'role_flexibility' => 0.10,
    ];

    public const TIER_SCORES = [
        'S' => 5,
        'A' => 4,
        'B' => 3,
        'C' => 2,
        'D' => 1,
    ];
}
