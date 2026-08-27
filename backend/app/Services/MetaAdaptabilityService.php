<?php

namespace App\Services;

use App\Models\Player;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MetaAdaptabilityService
{
    public function __construct(private readonly ?PatchTimelineService $patchTimeline = null) {}

    /** @return array<string, mixed> */
    public function refresh(Player $player): array
    {
        $profile = $this->calculateForPlayer($player->id, (float) $player->flexibility_score);

        $player->update([
            'meta_alignment_score' => $profile['components']['meta_alignment'],
            'meta_adaptability_index' => $profile['score'],
            'meta_adaptability_confidence' => $profile['confidence'],
            'meta_adaptability_profile' => $profile,
            'meta_adaptability_calculated_at' => now(),
        ]);

        Cache::forget('api_player_profile_'.$player->id);

        return $profile;
    }

    /** @return array<string, mixed> */
    public function calculateForPlayer(string $playerId, float $flexScore): array
    {
        $latestDate = DB::table('player_match_agents as pma')
            ->join('matches as m', 'm.id', '=', 'pma.match_id')
            ->where('pma.player_id', $playerId)
            ->whereNotNull('m.match_date')
            ->max('m.match_date');

        if ($latestDate === null) {
            return $this->emptyProfile($flexScore);
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
            ->leftJoin('patches as p', 'p.id', '=', 'm.patch_id')
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
                'm.patch_id',
                'm.match_date',
                'p.version as patch_version',
                'p.release_date',
                'match_ratings.rating',
            ])
            ->orderBy('p.release_date')
            ->orderBy('m.match_date')
            ->get()
            ->map(fn (object $row): array => (array) $row)
            ->all();
        $observations = ($this->patchTimeline ?? new PatchTimelineService)->infer($observations);

        $patchIds = array_values(array_unique(array_filter(array_map(
            fn (array $row): mixed => $row['patch_id'] ?? null,
            $observations
        ))));
        $ratings = DB::table('agent_patch_ratings')
            ->whereIn('patch_id', $patchIds)
            ->get(['patch_id', 'agent', 'tier', 'direction'])
            ->map(fn (object $row): array => (array) $row)
            ->all();
        $snapshots = $this->buildPatchSnapshots($observations, $ratings);

        return $this->calculateFromSnapshots(
            $snapshots,
            $flexScore,
            $windowStart->toDateString(),
            $windowEnd->toDateString()
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $observations
     * @param  array<int, array<string, mixed>>  $ratings
     * @return array<int, array<string, mixed>>
     */
    public function buildPatchSnapshots(array $observations, array $ratings): array
    {
        $ratingsByPatch = [];
        foreach ($ratings as $rating) {
            $patchId = (string) ($rating['patch_id'] ?? '');
            $agent = mb_strtolower(trim((string) ($rating['agent'] ?? '')));
            $tier = strtoupper(trim((string) ($rating['tier'] ?? '')));
            if ($patchId === '' || $agent === '' || ! isset(MetaAdaptabilityConfig::TIER_SCORES[$tier])) {
                continue;
            }
            $ratingsByPatch[$patchId][$agent] = [
                'tier' => MetaAdaptabilityConfig::TIER_SCORES[$tier],
                'direction' => mb_strtolower((string) ($rating['direction'] ?? 'unchanged')),
            ];
        }

        $buckets = [];
        foreach ($observations as $observation) {
            $patchId = trim((string) ($observation['patch_id'] ?? ''));
            $agent = trim((string) ($observation['agent_name'] ?? $observation['agent'] ?? ''));
            if ($patchId === '' || $agent === '') {
                continue;
            }

            $agentKey = mb_strtolower($agent);
            $role = $this->canonicalRole($observation['role_name'] ?? $observation['role'] ?? null);
            $rating = $this->positiveFloat($observation['rating'] ?? null);
            $buckets[$patchId] ??= [
                'patch_id' => $patchId,
                'version' => (string) ($observation['patch_version'] ?? $patchId),
                'release_date' => $observation['release_date'] ?? null,
                'map_count' => 0,
                'agent_counts' => [],
                'role_counts' => [],
                'performance_ratings' => [],
            ];
            $buckets[$patchId]['map_count']++;
            $buckets[$patchId]['agent_counts'][$agentKey] =
                ($buckets[$patchId]['agent_counts'][$agentKey] ?? 0) + 1;
            if ($role !== null) {
                $buckets[$patchId]['role_counts'][$role] =
                    ($buckets[$patchId]['role_counts'][$role] ?? 0) + 1;
            }
            if ($rating !== null) {
                $buckets[$patchId]['performance_ratings'][] = $rating;
            }
        }

        $snapshots = [];
        foreach ($buckets as $patchId => $bucket) {
            if ($bucket['map_count'] < MetaAdaptabilityConfig::MINIMUM_MAPS_PER_PATCH) {
                continue;
            }

            $agentRatings = $ratingsByPatch[$patchId] ?? [];
            $ratedMaps = 0;
            $alignmentTotal = 0.0;
            foreach ($bucket['agent_counts'] as $agent => $count) {
                if (! isset($agentRatings[$agent])) {
                    continue;
                }
                $ratedMaps += $count;
                $alignmentTotal += $this->tierToScale100($agentRatings[$agent]['tier']) * $count;
            }

            $snapshots[] = [
                'patch_id' => $patchId,
                'version' => $bucket['version'],
                'release_date' => $bucket['release_date'],
                'map_count' => $bucket['map_count'],
                'agent_counts' => $bucket['agent_counts'],
                'role_counts' => $bucket['role_counts'],
                'agent_ratings' => $agentRatings,
                'meta_alignment' => $ratedMaps > 0 ? $alignmentTotal / $ratedMaps : null,
                'tier_coverage' => $ratedMaps / max(1, $bucket['map_count']),
                'average_rating' => $this->average($bucket['performance_ratings']),
                'performance_coverage' => count($bucket['performance_ratings']) / max(1, $bucket['map_count']),
            ];
        }

        usort($snapshots, function (array $left, array $right): int {
            $leftDate = (string) ($left['release_date'] ?? '9999-12-31');
            $rightDate = (string) ($right['release_date'] ?? '9999-12-31');

            return [$leftDate, $left['patch_id']] <=> [$rightDate, $right['patch_id']];
        });

        return $snapshots;
    }

    /**
     * @param  array<int, array<string, mixed>>  $snapshots
     * @return array<string, mixed>
     */
    public function calculateFromSnapshots(
        array $snapshots,
        float $flexScore,
        ?string $windowStart = null,
        ?string $windowEnd = null
    ): array {
        if ($snapshots === []) {
            return $this->emptyProfile($flexScore, $windowStart, $windowEnd);
        }

        $alignmentWeighted = 0.0;
        $alignmentMaps = 0;
        $totalMaps = 0;
        $tierCoveredMaps = 0.0;
        $performanceCoveredMaps = 0.0;

        foreach ($snapshots as $snapshot) {
            $mapCount = (int) $snapshot['map_count'];
            $totalMaps += $mapCount;
            $tierCoveredMaps += ((float) ($snapshot['tier_coverage'] ?? 0)) * $mapCount;
            $performanceCoveredMaps += ((float) ($snapshot['performance_coverage'] ?? 0)) * $mapCount;
            if (($snapshot['meta_alignment'] ?? null) !== null) {
                $coveredMaps = ((float) ($snapshot['tier_coverage'] ?? 0)) * $mapCount;
                $alignmentWeighted += (float) $snapshot['meta_alignment'] * $coveredMaps;
                $alignmentMaps += $coveredMaps;
            }
        }

        $metaAlignment = $alignmentMaps > 0 ? $alignmentWeighted / $alignmentMaps : 0.0;
        $retentionScores = [];
        $responseScores = [];
        $transitions = [];

        for ($index = 1; $index < count($snapshots); $index++) {
            $previous = $snapshots[$index - 1];
            $current = $snapshots[$index];
            $previousRating = $previous['average_rating'] ?? null;
            $currentRating = $current['average_rating'] ?? null;
            $performanceRetention = $previousRating !== null && $currentRating !== null && $previousRating > 0
                ? $this->clamp(((float) $currentRating / (float) $previousRating) * 100)
                : null;
            if ($performanceRetention !== null) {
                $retentionScores[] = $performanceRetention;
            }

            $previousViability = $this->poolViability($previous['agent_counts'], $previous['agent_ratings']);
            $oldPoolCurrentViability = $this->poolViability($previous['agent_counts'], $current['agent_ratings']);
            $currentViability = $this->poolViability($current['agent_counts'], $current['agent_ratings']);
            $decline = $previousViability !== null && $oldPoolCurrentViability !== null
                ? max(0.0, (($previousViability - $oldPoolCurrentViability) / 4) * 100)
                : 0.0;
            $disruptionExposure = $this->disruptionExposure($previous['agent_counts'], $current['agent_ratings']);
            $shiftMagnitude = max($decline, $disruptionExposure * 50);
            $isOpportunity = $shiftMagnitude >= MetaAdaptabilityConfig::MINIMUM_META_SHIFT;
            $response = null;

            if ($isOpportunity && $oldPoolCurrentViability !== null && $currentViability !== null) {
                $viabilityGain = (($currentViability - $oldPoolCurrentViability) / 4) * 100;
                $viabilityResponse = $this->clamp(50 + ($viabilityGain * 0.5));
                $response = $performanceRetention === null
                    ? $viabilityResponse
                    : ($viabilityResponse * 0.60) + ($performanceRetention * 0.40);
                $responseScores[] = $response;
            }

            $transitions[] = [
                'from_patch' => $previous['version'],
                'to_patch' => $current['version'],
                'meta_shift' => round($shiftMagnitude, 1),
                'adaptation_opportunity' => $isOpportunity,
                'performance_retention' => $performanceRetention === null ? null : round($performanceRetention, 1),
                'response_score' => $response === null ? null : round($response, 1),
                'agent_pool_change' => round($this->distributionDistance(
                    $previous['agent_counts'],
                    $current['agent_counts']
                ), 1),
            ];
        }

        $performanceRetention = $retentionScores === [] ? 50.0 : (float) $this->average($retentionScores);
        $metaResponse = $responseScores === [] ? 50.0 : (float) $this->average($responseScores);
        $components = [
            'meta_alignment' => $this->clamp($metaAlignment),
            'performance_retention' => $this->clamp($performanceRetention),
            'meta_response' => $this->clamp($metaResponse),
            'role_flexibility' => $this->clamp($flexScore),
        ];
        $score = 0.0;
        foreach (MetaAdaptabilityConfig::COMPONENT_WEIGHTS as $component => $weight) {
            $score += $components[$component] * $weight;
        }

        $tierCoverage = $tierCoveredMaps / max(1, $totalMaps);
        $performanceCoverage = $performanceCoveredMaps / max(1, $totalMaps);
        $opportunityCount = count(array_filter(
            $transitions,
            fn (array $transition): bool => $transition['adaptation_opportunity']
        ));
        $confidence = match (true) {
            $totalMaps >= MetaAdaptabilityConfig::HIGH_CONFIDENCE_MAPS
                && count($snapshots) >= MetaAdaptabilityConfig::HIGH_CONFIDENCE_PATCHES
                && $opportunityCount >= 2
                && $tierCoverage >= MetaAdaptabilityConfig::HIGH_CONFIDENCE_COVERAGE
                && $performanceCoverage >= MetaAdaptabilityConfig::HIGH_CONFIDENCE_COVERAGE => 'high',
            $totalMaps >= MetaAdaptabilityConfig::MINIMUM_MAPS
                && count($snapshots) >= MetaAdaptabilityConfig::MINIMUM_ACTIVE_PATCHES
                && $opportunityCount >= 1
                && $tierCoverage >= MetaAdaptabilityConfig::MINIMUM_COVERAGE
                && $performanceCoverage >= MetaAdaptabilityConfig::MINIMUM_COVERAGE => 'medium',
            default => 'low',
        };

        return [
            'method' => MetaAdaptabilityConfig::METHOD_VERSION,
            'score' => round($this->clamp($score), 1),
            'confidence' => $confidence,
            'window' => [
                'months' => RoleProfileConfig::WINDOW_MONTHS,
                'started_at' => $windowStart,
                'ended_at' => $windowEnd,
            ],
            'components' => array_map(fn (float $value): float => round($value, 1), $components),
            'evidence' => [
                'map_count' => $totalMaps,
                'active_patch_count' => count($snapshots),
                'transition_count' => count($transitions),
                'adaptation_opportunity_count' => $opportunityCount,
                'tier_coverage' => round($tierCoverage, 3),
                'performance_coverage' => round($performanceCoverage, 3),
            ],
            'patches' => array_map(fn (array $snapshot): array => [
                'patch' => $snapshot['version'],
                'map_count' => $snapshot['map_count'],
                'meta_alignment' => $snapshot['meta_alignment'] === null
                    ? null
                    : round((float) $snapshot['meta_alignment'], 1),
                'tier_coverage' => round((float) $snapshot['tier_coverage'], 3),
            ], $snapshots),
            'transitions' => $transitions,
        ];
    }

    /** @param array<string, int> $agentCounts @param array<string, array<string, mixed>> $agentRatings */
    private function poolViability(array $agentCounts, array $agentRatings): ?float
    {
        $weighted = 0.0;
        $ratedMaps = 0;
        foreach ($agentCounts as $agent => $count) {
            if (! isset($agentRatings[$agent]['tier'])) {
                continue;
            }
            $weighted += (float) $agentRatings[$agent]['tier'] * $count;
            $ratedMaps += $count;
        }

        return $ratedMaps > 0 ? $weighted / $ratedMaps : null;
    }

    /** @param array<string, int> $agentCounts @param array<string, array<string, mixed>> $agentRatings */
    private function disruptionExposure(array $agentCounts, array $agentRatings): float
    {
        $total = array_sum($agentCounts);
        if ($total <= 0) {
            return 0.0;
        }

        $exposed = 0;
        foreach ($agentCounts as $agent => $count) {
            $direction = $agentRatings[$agent]['direction'] ?? 'unchanged';
            if (in_array($direction, ['nerfed', 'reworked'], true)) {
                $exposed += $count;
            }
        }

        return $exposed / $total;
    }

    /** @param array<string, int> $left @param array<string, int> $right */
    private function distributionDistance(array $left, array $right): float
    {
        $leftTotal = max(1, array_sum($left));
        $rightTotal = max(1, array_sum($right));
        $agents = array_unique([...array_keys($left), ...array_keys($right)]);
        $distance = 0.0;
        foreach ($agents as $agent) {
            $distance += abs((($left[$agent] ?? 0) / $leftTotal) - (($right[$agent] ?? 0) / $rightTotal));
        }

        return ($distance / 2) * 100;
    }

    private function tierToScale100(int $tier): float
    {
        return (($tier - 1) / 4) * 100;
    }

    private function canonicalRole(mixed $role): ?string
    {
        $normalized = ucfirst(mb_strtolower(trim((string) $role)));

        return in_array($normalized, RoleProfileConfig::OFFICIAL_ROLES, true) ? $normalized : null;
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

    private function clamp(float $value, float $minimum = 0.0, float $maximum = 100.0): float
    {
        return max($minimum, min($maximum, $value));
    }

    /** @return array<string, mixed> */
    private function emptyProfile(
        float $flexScore,
        ?string $windowStart = null,
        ?string $windowEnd = null
    ): array {
        return [
            'method' => MetaAdaptabilityConfig::METHOD_VERSION,
            'score' => round($this->clamp($flexScore * MetaAdaptabilityConfig::COMPONENT_WEIGHTS['role_flexibility']), 1),
            'confidence' => 'low',
            'window' => [
                'months' => RoleProfileConfig::WINDOW_MONTHS,
                'started_at' => $windowStart,
                'ended_at' => $windowEnd,
            ],
            'components' => [
                'meta_alignment' => 0.0,
                'performance_retention' => 0.0,
                'meta_response' => 0.0,
                'role_flexibility' => round($this->clamp($flexScore), 1),
            ],
            'evidence' => [
                'map_count' => 0,
                'active_patch_count' => 0,
                'transition_count' => 0,
                'adaptation_opportunity_count' => 0,
                'tier_coverage' => 0.0,
                'performance_coverage' => 0.0,
            ],
            'patches' => [],
            'transitions' => [],
        ];
    }
}
