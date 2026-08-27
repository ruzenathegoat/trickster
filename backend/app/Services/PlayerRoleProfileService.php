<?php

namespace App\Services;

use App\Models\Player;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PlayerRoleProfileService
{
    public function __construct(private readonly ?PatchTimelineService $patchTimeline = null) {}

    /** @return array<string, mixed> */
    public function refresh(Player $player): array
    {
        $profile = $this->calculateForPlayer($player->id, $player->current_role);

        $player->update([
            'current_role' => $profile['primary_role'],
            'role_archetype' => $profile['archetype'],
            'flexibility_score' => $profile['flex_score'],
            'flex_confidence' => $profile['confidence'],
            'flex_profile' => $profile,
            'role_profile_calculated_at' => now(),
        ]);

        Cache::forget('api_player_profile_'.$player->id);

        return $profile;
    }

    /** @return array<string, mixed> */
    public function calculateForPlayer(string $playerId, ?string $fallbackRole = null): array
    {
        $latestDate = DB::table('player_match_agents as pma')
            ->join('matches as m', 'm.id', '=', 'pma.match_id')
            ->where('pma.player_id', $playerId)
            ->whereNotNull('m.match_date')
            ->max('m.match_date');

        if ($latestDate === null) {
            return $this->emptyProfile($fallbackRole);
        }

        $windowEnd = CarbonImmutable::parse((string) $latestDate)->endOfDay();
        $windowStart = $windowEnd->subMonthsNoOverflow(RoleProfileConfig::WINDOW_MONTHS)->startOfDay();
        $matchRatings = DB::table('player_map_stats as rating_stats')
            ->join('maps as rating_maps', 'rating_maps.id', '=', 'rating_stats.map_id')
            ->where('rating_maps.map_name', 'All Maps')
            ->whereNotNull('rating_stats.rating')
            ->where('rating_stats.rating', '>', 0)
            ->select(
                'rating_stats.player_id',
                'rating_stats.match_id',
                DB::raw('MAX(rating_stats.rating) as rating')
            )
            ->groupBy('rating_stats.player_id', 'rating_stats.match_id');

        $observations = DB::table('player_match_agents as pma')
            ->join('matches as m', 'm.id', '=', 'pma.match_id')
            ->leftJoin('agent_role_maps as arm', function ($join) {
                $join->on(
                    DB::raw('LOWER(arm.agent_name)'),
                    '=',
                    DB::raw('LOWER(pma.agent_name)')
                );
            })
            ->leftJoinSub($matchRatings, 'match_ratings', function ($join) {
                $join->on('match_ratings.player_id', '=', 'pma.player_id')
                    ->on('match_ratings.match_id', '=', 'pma.match_id');
            })
            ->where('pma.player_id', $playerId)
            ->whereBetween('m.match_date', [$windowStart->toDateString(), $windowEnd->toDateString()])
            ->select([
                'pma.agent_name',
                'arm.role_name',
                'm.event_id',
                'm.patch_id',
                'm.match_date',
                'match_ratings.rating',
            ])
            ->orderBy('m.match_date')
            ->get()
            ->map(fn (object $row): array => (array) $row)
            ->all();
        $observations = ($this->patchTimeline ?? new PatchTimelineService)->infer($observations);

        $performance = $this->rolePerformance($playerId, $windowStart, $windowEnd);

        return $this->calculateFromObservations(
            $observations,
            $performance,
            $windowStart->toDateString(),
            $windowEnd->toDateString(),
            $fallbackRole
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $observations
     * @param  array<string, array{score: float, sample_size: int}>  $rolePerformance
     * @return array<string, mixed>
     */
    public function calculateFromObservations(
        array $observations,
        array $rolePerformance = [],
        ?string $windowStart = null,
        ?string $windowEnd = null,
        ?string $fallbackRole = null
    ): array {
        $roleBuckets = [];
        $agentBuckets = [];
        $mappedMaps = 0;

        foreach ($observations as $observation) {
            $role = $this->canonicalRole($observation['role_name'] ?? $observation['role'] ?? null);
            if ($role === null) {
                continue;
            }

            $agent = trim((string) ($observation['agent_name'] ?? $observation['agent'] ?? ''));
            if ($agent === '') {
                continue;
            }

            $mappedMaps++;
            $agentKey = mb_strtolower($agent);
            $eventId = $this->nullableKey($observation['event_id'] ?? null);
            $patchId = $this->nullableKey($observation['patch_id'] ?? null);
            $rating = $this->positiveFloat($observation['rating'] ?? null);

            $roleBuckets[$role] ??= [
                'map_count' => 0,
                'events' => [],
                'patches' => [],
                'ratings' => [],
                'agents' => [],
            ];
            $roleBuckets[$role]['map_count']++;
            $roleBuckets[$role]['agents'][$agentKey] = $agent;
            if ($eventId !== null) {
                $roleBuckets[$role]['events'][$eventId] = true;
            }
            if ($patchId !== null) {
                $roleBuckets[$role]['patches'][$patchId] = true;
            }
            if ($rating !== null) {
                $roleBuckets[$role]['ratings'][] = $rating;
            }

            $agentBuckets[$agentKey] ??= [
                'name' => $agent,
                'role' => $role,
                'map_count' => 0,
            ];
            $agentBuckets[$agentKey]['map_count']++;
        }

        if ($mappedMaps === 0) {
            return $this->emptyProfile($fallbackRole, count($observations));
        }

        uasort($roleBuckets, fn (array $a, array $b): int => $b['map_count'] <=> $a['map_count']);
        uasort($agentBuckets, fn (array $a, array $b): int => $b['map_count'] <=> $a['map_count']);

        $primaryRole = (string) array_key_first($roleBuckets);
        $primaryAverageRating = $this->average($roleBuckets[$primaryRole]['ratings']);
        $roleDistribution = [];
        $qualifiedRoles = [];
        $repeatableRoles = [];
        $performanceScores = [];
        $performancePasses = [];
        $performanceSources = [];

        foreach ($roleBuckets as $role => $bucket) {
            $share = $bucket['map_count'] / $mappedMaps;
            $qualified = $bucket['map_count'] >= RoleProfileConfig::MINIMUM_ROLE_MAPS
                && $share >= RoleProfileConfig::MINIMUM_ROLE_SHARE;
            $repeatable = count($bucket['events']) >= RoleProfileConfig::MINIMUM_EVENTS
                || count($bucket['patches']) >= RoleProfileConfig::MINIMUM_PATCHES;
            $averageRating = $this->average($bucket['ratings']);
            $normalizedPerformance = $this->normalizedRolePerformance(
                $role,
                $rolePerformance,
                $averageRating,
                $primaryAverageRating,
                count($bucket['ratings'])
            );

            if ($qualified) {
                $qualifiedRoles[] = $role;
                if ($repeatable) {
                    $repeatableRoles[] = $role;
                }
                $performanceScores[] = $normalizedPerformance['score'];
                $performancePasses[] = $normalizedPerformance['passes_floor'];
                $performanceSources[] = $normalizedPerformance['source'];
            }

            $roleDistribution[] = [
                'role' => $role,
                'map_count' => $bucket['map_count'],
                'share' => round($share * 100, 1),
                'agent_count' => count($bucket['agents']),
                'event_count' => count($bucket['events']),
                'patch_count' => count($bucket['patches']),
                'average_rating' => $averageRating === null ? null : round($averageRating, 3),
                'performance_score' => round($normalizedPerformance['score'], 1),
                'performance_source' => $normalizedPerformance['source'],
                'performance_sample_size' => $normalizedPerformance['sample_size'],
                'qualified' => $qualified,
                'repeatable' => $repeatable,
            ];
        }

        $qualifiedAgents = array_values(array_filter(
            $agentBuckets,
            fn (array $agent): bool => $agent['map_count'] >= RoleProfileConfig::MINIMUM_AGENT_MAPS
        ));
        $eventCount = $this->uniqueCount($observations, 'event_id');
        $patchCount = $this->uniqueCount($observations, 'patch_id');
        $effectiveRoles = $this->effectiveCount(array_column($roleDistribution, 'map_count'));
        $effectiveQualifiedRoles = $this->effectiveCount(array_column(
            array_values(array_filter($roleDistribution, fn (array $role): bool => $role['qualified'])),
            'map_count'
        ));
        $effectiveAgents = $this->effectiveCount(array_column($agentBuckets, 'map_count'));
        $qualifiedRoleCount = count($qualifiedRoles);
        $qualifiedAgentCount = count($qualifiedAgents);
        $repeatableRoleCount = count($repeatableRoles);
        $agentDiverseRoleCount = count(array_filter(
            $roleDistribution,
            fn (array $role): bool => $role['qualified'] && $role['agent_count'] >= 2
        ));
        $medianPerformance = $this->median($performanceScores);

        $components = [
            'role_breadth' => $this->clamp((($effectiveQualifiedRoles - 1) / 2) * 100),
            'agent_breadth' => $this->clamp((($effectiveAgents - 1) / 6) * 100),
            'usage_balance' => $this->qualifiedUsageBalance($roleDistribution),
            'cross_role_performance' => $performanceScores === [] ? 0.0 : $this->average($performanceScores),
            'repeatability' => $qualifiedRoleCount === 0
                ? 0.0
                : ($repeatableRoleCount / $qualifiedRoleCount) * 100,
        ];
        $flexScore = 0.0;
        foreach (RoleProfileConfig::COMPONENT_WEIGHTS as $component => $weight) {
            $flexScore += $components[$component] * $weight;
        }
        $flexScore = round($this->clamp($flexScore), 1);

        $performanceGate = $qualifiedRoleCount >= 3
            && ! in_array(false, $performancePasses, true)
            && $this->medianPerformancePasses($medianPerformance, $performanceSources);
        $baseFlexGate = $mappedMaps >= RoleProfileConfig::MINIMUM_TOTAL_MAPS
            && $qualifiedRoleCount >= 3
            && $qualifiedAgentCount >= RoleProfileConfig::MINIMUM_FLEX_AGENTS
            && $agentDiverseRoleCount >= 3
            && $effectiveQualifiedRoles >= RoleProfileConfig::MINIMUM_EFFECTIVE_ROLES
            && $eventCount >= RoleProfileConfig::MINIMUM_EVENTS
            && $patchCount >= RoleProfileConfig::MINIMUM_PATCHES
            && $repeatableRoleCount >= 3
            && $performanceGate
            && $flexScore >= RoleProfileConfig::MINIMUM_FLEX_SCORE;

        $eliteFlexGate = $baseFlexGate
            && $mappedMaps >= RoleProfileConfig::HIGH_CONFIDENCE_MAPS
            && $qualifiedRoleCount === count(RoleProfileConfig::OFFICIAL_ROLES)
            && $qualifiedAgentCount >= RoleProfileConfig::MINIMUM_ELITE_FLEX_AGENTS
            && $agentDiverseRoleCount === count(RoleProfileConfig::OFFICIAL_ROLES)
            && $effectiveQualifiedRoles >= RoleProfileConfig::MINIMUM_ELITE_EFFECTIVE_ROLES
            && $repeatableRoleCount === count(RoleProfileConfig::OFFICIAL_ROLES)
            && $flexScore >= RoleProfileConfig::MINIMUM_ELITE_FLEX_SCORE;

        $archetype = match (true) {
            $eliteFlexGate => 'Elite Flex',
            $baseFlexGate => 'Flex',
            $qualifiedRoleCount >= 3 => 'Multi-role',
            $qualifiedRoleCount === 2 => 'Dual-role',
            default => 'Specialist',
        };

        $confidence = match (true) {
            $mappedMaps >= RoleProfileConfig::HIGH_CONFIDENCE_MAPS
                && $eventCount >= RoleProfileConfig::HIGH_CONFIDENCE_EVENTS
                && $patchCount >= RoleProfileConfig::HIGH_CONFIDENCE_PATCHES
                && $performanceScores !== [] => 'high',
            $mappedMaps >= RoleProfileConfig::MINIMUM_TOTAL_MAPS
                && $eventCount >= RoleProfileConfig::MINIMUM_EVENTS
                && $patchCount >= RoleProfileConfig::MINIMUM_PATCHES
                && $performanceScores !== [] => 'medium',
            default => 'low',
        };

        return [
            'method' => RoleProfileConfig::METHOD_VERSION,
            'window' => [
                'months' => RoleProfileConfig::WINDOW_MONTHS,
                'started_at' => $windowStart,
                'ended_at' => $windowEnd,
            ],
            'primary_role' => $primaryRole,
            'archetype' => $archetype,
            'flex_score' => $flexScore,
            'confidence' => $confidence,
            'components' => array_map(fn (float $value): float => round($value, 1), $components),
            'evidence' => [
                'map_count' => $mappedMaps,
                'observed_map_count' => count($observations),
                'data_coverage' => round($mappedMaps / max(1, count($observations)), 3),
                'event_count' => $eventCount,
                'patch_count' => $patchCount,
                'qualified_role_count' => $qualifiedRoleCount,
                'repeatable_role_count' => $repeatableRoleCount,
                'qualified_agent_count' => $qualifiedAgentCount,
                'agent_diverse_role_count' => $agentDiverseRoleCount,
                'effective_roles' => round($effectiveRoles, 2),
                'effective_qualified_roles' => round($effectiveQualifiedRoles, 2),
                'effective_agents' => round($effectiveAgents, 2),
                'median_cross_role_performance' => round($medianPerformance, 1),
                'performance_gate_passed' => $performanceGate,
            ],
            'role_distribution' => $roleDistribution,
            'qualified_agents' => array_map(
                fn (array $agent): array => [
                    'name' => $agent['name'],
                    'role' => $agent['role'],
                    'map_count' => $agent['map_count'],
                ],
                $qualifiedAgents
            ),
            'thresholds' => [
                'minimum_maps' => RoleProfileConfig::MINIMUM_TOTAL_MAPS,
                'minimum_role_maps' => RoleProfileConfig::MINIMUM_ROLE_MAPS,
                'minimum_role_share' => RoleProfileConfig::MINIMUM_ROLE_SHARE,
                'minimum_agent_maps' => RoleProfileConfig::MINIMUM_AGENT_MAPS,
                'minimum_flex_agents' => RoleProfileConfig::MINIMUM_FLEX_AGENTS,
                'minimum_effective_roles' => RoleProfileConfig::MINIMUM_EFFECTIVE_ROLES,
                'minimum_events' => RoleProfileConfig::MINIMUM_EVENTS,
                'minimum_patches' => RoleProfileConfig::MINIMUM_PATCHES,
            ],
        ];
    }

    /** @return array<string, array{score: float, sample_size: int}> */
    private function rolePerformance(string $playerId, CarbonImmutable $windowStart, CarbonImmutable $windowEnd): array
    {
        if (! Schema::hasTable('player_match_quality_metrics')) {
            return [];
        }

        return DB::table('player_match_quality_metrics as pqm')
            ->join('matches as m', 'm.id', '=', 'pqm.match_id')
            ->where('pqm.player_id', $playerId)
            ->whereBetween('m.match_date', [$windowStart->toDateString(), $windowEnd->toDateString()])
            ->whereIn('pqm.role', RoleProfileConfig::OFFICIAL_ROLES)
            ->select('pqm.role', DB::raw('AVG(pqm.performance_utility) as score'), DB::raw('COUNT(*) as sample_size'))
            ->groupBy('pqm.role')
            ->get()
            ->mapWithKeys(fn (object $row): array => [
                $this->canonicalRole($row->role) => [
                    'score' => (float) $row->score,
                    'sample_size' => (int) $row->sample_size,
                ],
            ])
            ->filter(fn (array $value, mixed $key): bool => $key !== null)
            ->all();
    }

    /** @return array{score: float, sample_size: int, source: string, passes_floor: bool} */
    private function normalizedRolePerformance(
        string $role,
        array $rolePerformance,
        ?float $averageRating,
        ?float $primaryAverageRating,
        int $ratingSampleSize
    ): array {
        $external = $rolePerformance[$role] ?? null;
        if ($external !== null && $external['sample_size'] >= RoleProfileConfig::MINIMUM_PERFORMANCE_MATCHES) {
            $score = $this->clamp((float) $external['score']);

            return [
                'score' => $score,
                'sample_size' => (int) $external['sample_size'],
                'source' => 'role_percentile',
                'passes_floor' => $score >= RoleProfileConfig::MINIMUM_ROLE_PERFORMANCE_PERCENTILE,
            ];
        }

        if ($averageRating !== null && $primaryAverageRating !== null && $primaryAverageRating > 0) {
            $score = $this->clamp(($averageRating / $primaryAverageRating) * 100);

            return [
                'score' => $score,
                'sample_size' => $ratingSampleSize,
                'source' => 'rating_retention',
                'passes_floor' => $ratingSampleSize >= RoleProfileConfig::MINIMUM_ROLE_MAPS
                    && $score >= RoleProfileConfig::MINIMUM_RATING_RETENTION,
            ];
        }

        return [
            'score' => 0.0,
            'sample_size' => 0,
            'source' => 'insufficient_data',
            'passes_floor' => false,
        ];
    }

    private function medianPerformancePasses(float $median, array $sources): bool
    {
        if ($sources === []) {
            return false;
        }

        $onlyPercentiles = count(array_unique($sources)) === 1 && $sources[0] === 'role_percentile';

        return $median >= ($onlyPercentiles
            ? RoleProfileConfig::MINIMUM_MEDIAN_PERFORMANCE_PERCENTILE
            : RoleProfileConfig::MINIMUM_MEDIAN_RATING_RETENTION);
    }

    /** @param array<int, array<string, mixed>> $roleDistribution */
    private function qualifiedUsageBalance(array $roleDistribution): float
    {
        $counts = array_column(
            array_values(array_filter($roleDistribution, fn (array $role): bool => $role['qualified'])),
            'map_count'
        );

        if (count($counts) <= 1) {
            return 0.0;
        }

        $effective = $this->effectiveCount($counts);

        return $this->clamp(($effective / count($counts)) * 100);
    }

    /** @param array<int, int|float> $counts */
    private function effectiveCount(array $counts): float
    {
        $total = array_sum($counts);
        if ($total <= 0) {
            return 0.0;
        }

        $entropy = 0.0;
        foreach ($counts as $count) {
            if ($count <= 0) {
                continue;
            }
            $share = $count / $total;
            $entropy -= $share * log($share);
        }

        return exp($entropy);
    }

    /** @param array<int, array<string, mixed>> $observations */
    private function uniqueCount(array $observations, string $key): int
    {
        $values = [];
        foreach ($observations as $observation) {
            $value = $this->nullableKey($observation[$key] ?? null);
            if ($value !== null) {
                $values[$value] = true;
            }
        }

        return count($values);
    }

    private function canonicalRole(mixed $role): ?string
    {
        $normalized = ucfirst(mb_strtolower(trim((string) $role)));

        return in_array($normalized, RoleProfileConfig::OFFICIAL_ROLES, true) ? $normalized : null;
    }

    private function nullableKey(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function positiveFloat(mixed $value): ?float
    {
        if (! is_numeric($value) || (float) $value <= 0) {
            return null;
        }

        return (float) $value;
    }

    /** @param array<int, int|float> $values */
    private function average(array $values): ?float
    {
        return $values === [] ? null : array_sum($values) / count($values);
    }

    /** @param array<int, int|float> $values */
    private function median(array $values): float
    {
        if ($values === []) {
            return 0.0;
        }

        sort($values, SORT_NUMERIC);
        $middle = intdiv(count($values), 2);

        return count($values) % 2 === 0
            ? ($values[$middle - 1] + $values[$middle]) / 2
            : (float) $values[$middle];
    }

    private function clamp(float $value, float $minimum = 0.0, float $maximum = 100.0): float
    {
        return max($minimum, min($maximum, $value));
    }

    /** @return array<string, mixed> */
    private function emptyProfile(?string $fallbackRole, int $observedMaps = 0): array
    {
        $primaryRole = $this->canonicalRole($fallbackRole) ?? 'Unknown';

        return [
            'method' => RoleProfileConfig::METHOD_VERSION,
            'window' => [
                'months' => RoleProfileConfig::WINDOW_MONTHS,
                'started_at' => null,
                'ended_at' => null,
            ],
            'primary_role' => $primaryRole,
            'archetype' => 'Specialist',
            'flex_score' => 0.0,
            'confidence' => 'low',
            'components' => [
                'role_breadth' => 0.0,
                'agent_breadth' => 0.0,
                'usage_balance' => 0.0,
                'cross_role_performance' => 0.0,
                'repeatability' => 0.0,
            ],
            'evidence' => [
                'map_count' => 0,
                'observed_map_count' => $observedMaps,
                'data_coverage' => 0.0,
                'event_count' => 0,
                'patch_count' => 0,
                'qualified_role_count' => 0,
                'repeatable_role_count' => 0,
                'qualified_agent_count' => 0,
                'agent_diverse_role_count' => 0,
                'effective_roles' => 0.0,
                'effective_qualified_roles' => 0.0,
                'effective_agents' => 0.0,
                'median_cross_role_performance' => 0.0,
                'performance_gate_passed' => false,
            ],
            'role_distribution' => [],
            'qualified_agents' => [],
            'thresholds' => [
                'minimum_maps' => RoleProfileConfig::MINIMUM_TOTAL_MAPS,
                'minimum_role_maps' => RoleProfileConfig::MINIMUM_ROLE_MAPS,
                'minimum_role_share' => RoleProfileConfig::MINIMUM_ROLE_SHARE,
                'minimum_agent_maps' => RoleProfileConfig::MINIMUM_AGENT_MAPS,
                'minimum_flex_agents' => RoleProfileConfig::MINIMUM_FLEX_AGENTS,
                'minimum_effective_roles' => RoleProfileConfig::MINIMUM_EFFECTIVE_ROLES,
                'minimum_events' => RoleProfileConfig::MINIMUM_EVENTS,
                'minimum_patches' => RoleProfileConfig::MINIMUM_PATCHES,
            ],
        ];
    }
}
