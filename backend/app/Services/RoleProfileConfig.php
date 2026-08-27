<?php

namespace App\Services;

final class RoleProfileConfig
{
    public const METHOD_VERSION = 'role-profile-v2';

    public const WINDOW_MONTHS = 12;

    public const MINIMUM_TOTAL_MAPS = 30;

    public const HIGH_CONFIDENCE_MAPS = 50;

    public const MINIMUM_ROLE_MAPS = 5;

    public const MINIMUM_ROLE_SHARE = 0.05;

    public const MINIMUM_AGENT_MAPS = 3;

    public const MINIMUM_FLEX_AGENTS = 5;

    public const MINIMUM_ELITE_FLEX_AGENTS = 7;

    public const MINIMUM_EVENTS = 2;

    public const HIGH_CONFIDENCE_EVENTS = 3;

    public const MINIMUM_PATCHES = 2;

    public const HIGH_CONFIDENCE_PATCHES = 3;

    public const MINIMUM_EFFECTIVE_ROLES = 1.95;

    public const MINIMUM_ELITE_EFFECTIVE_ROLES = 3.20;

    public const MINIMUM_FLEX_SCORE = 70.0;

    public const MINIMUM_ELITE_FLEX_SCORE = 82.0;

    public const MINIMUM_PERFORMANCE_MATCHES = 3;

    public const MINIMUM_ROLE_PERFORMANCE_PERCENTILE = 40.0;

    public const MINIMUM_MEDIAN_PERFORMANCE_PERCENTILE = 50.0;

    public const MINIMUM_RATING_RETENTION = 80.0;

    public const MINIMUM_MEDIAN_RATING_RETENTION = 85.0;

    public const OFFICIAL_ROLES = [
        'Duelist',
        'Initiator',
        'Controller',
        'Sentinel',
    ];

    public const COMPONENT_WEIGHTS = [
        'role_breadth' => 0.30,
        'agent_breadth' => 0.20,
        'usage_balance' => 0.20,
        'cross_role_performance' => 0.20,
        'repeatability' => 0.10,
    ];
}
