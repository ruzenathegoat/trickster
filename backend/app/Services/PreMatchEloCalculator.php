<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class PreMatchEloCalculator
{
    /** @var array<int, array<string, mixed>> */
    private array $regionalMatrix = [];

    /**
     * @param  array<int, array<string, mixed>>  $matches
     * @return array<int, array<string, mixed>>
     */
    public function calculate(array $matches, int $season): array
    {
        $homeRegions = $this->homeRegions($matches);
        $teamIds = [];
        foreach ($matches as $match) {
            $teamIds[(string) $match['team_a_id']] = true;
            $teamIds[(string) $match['team_b_id']] = true;
        }

        $ratings = [];
        $games = [];
        foreach (array_keys($teamIds) as $teamId) {
            $ratings[$teamId] = CompetitionQualityConfig::regionPrior($homeRegions[$teamId] ?? null);
            $games[$teamId] = 0;
        }

        // Initialize Dynamic Regional Strength Vector
        $regionalElo = CompetitionQualityConfig::REGION_RATING_PRIORS;
        $regionalStats = [];
        foreach (array_keys(CompetitionQualityConfig::REGION_RATING_PRIORS) as $reg) {
            $regionalStats[$reg] = [
                'region' => $reg,
                'initial_elo' => CompetitionQualityConfig::REGION_RATING_PRIORS[$reg],
                'current_elo' => CompetitionQualityConfig::REGION_RATING_PRIORS[$reg],
                'international_matches' => 0,
                'international_wins' => 0,
                'international_win_rate' => 0.0,
                'strength_coefficient' => round(CompetitionQualityConfig::REGION_RATING_PRIORS[$reg] / 1500.0, 4),
            ];
        }

        // Preload individual maps played per match for sweep / margin scaling
        $matchIds = array_column($matches, 'id');
        $mapCounts = [];
        if ($matchIds !== []) {
            $mapCounts = DB::table('maps')
                ->whereIn('match_id', $matchIds)
                ->where('map_name', '!=', 'All Maps')
                ->select('match_id', DB::raw('count(id) as count'))
                ->groupBy('match_id')
                ->pluck('count', 'match_id')
                ->all();
        }

        usort($matches, static function (array $a, array $b): int {
            $dateComparison = strcmp((string) $a['match_date'], (string) $b['match_date']);

            return $dateComparison !== 0
                ? $dateComparison
                : strcmp((string) $a['id'], (string) $b['id']);
        });

        $rows = [];
        foreach ($matches as $match) {
            $teamA = (string) $match['team_a_id'];
            $teamB = (string) $match['team_b_id'];
            $ratingA = $ratings[$teamA];
            $ratingB = $ratings[$teamB];
            $percentileA = $this->percentile($ratings, $ratingA);
            $percentileB = $this->percentile($ratings, $ratingB);
            $confidenceA = $games[$teamA] / ($games[$teamA] + CompetitionQualityConfig::RELIABILITY_K);
            $confidenceB = $games[$teamB] / ($games[$teamB] + CompetitionQualityConfig::RELIABILITY_K);
            $expectedA = 1 / (1 + (10 ** (($ratingB - $ratingA) / 400)));
            $expectedB = 1 - $expectedA;
            $scoreA = (string) $match['winner_team_id'] === $teamA ? 1.0 : 0.0;
            $scoreB = 1 - $scoreA;

            // Adaptive ELO K-factor based on tournament stakes and series margin (e.g. 2-0 sweep vs 2-1)
            $mapsPlayed = (int) ($mapCounts[$match['id']] ?? ($match['best_of'] ?? 3));
            $bestOf = isset($match['best_of']) ? (int) $match['best_of'] : 3;
            $marginMultiplier = CompetitionQualityConfig::marginMultiplier($mapsPlayed, $bestOf);
            $stakesMultiplier = CompetitionQualityConfig::stakesMultiplier($match['competition_level'] ?? null);
            $kTeam = CompetitionQualityConfig::ELO_K * $stakesMultiplier * $marginMultiplier;

            $afterA = $ratingA + ($kTeam * ($scoreA - $expectedA));
            $afterB = $ratingB + ($kTeam * ($scoreB - $expectedB));

            // Dynamic Regional Strength Update on Cross-Regional (International) Matches
            $regionA = $homeRegions[$teamA] ?? null;
            $regionB = $homeRegions[$teamB] ?? null;
            if (
                $regionA !== null && $regionB !== null
                && $regionA !== $regionB
                && isset($regionalElo[$regionA], $regionalElo[$regionB])
            ) {
                $regRatingA = $regionalElo[$regionA];
                $regRatingB = $regionalElo[$regionB];
                $expectedRegA = 1.0 / (1.0 + (10.0 ** (($regRatingB - $regRatingA) / 400.0)));

                $kReg = CompetitionQualityConfig::REGIONAL_ELO_K * $stakesMultiplier * $marginMultiplier;
                $deltaReg = $kReg * ($scoreA - $expectedRegA);

                $regionalElo[$regionA] += $deltaReg;
                $regionalElo[$regionB] -= $deltaReg;

                $regionalStats[$regionA]['international_matches']++;
                $regionalStats[$regionB]['international_matches']++;

                if ($scoreA === 1.0) {
                    $regionalStats[$regionA]['international_wins']++;
                } else {
                    $regionalStats[$regionB]['international_wins']++;
                }
            }

            $common = [
                'match_id' => $match['id'],
                'season' => $season,
                'method_version' => CompetitionQualityConfig::ELO_METHOD_VERSION,
            ];
            $rows[] = array_merge($common, [
                'team_id' => $teamA,
                'opponent_id' => $teamB,
                'rating_before' => round($ratingA, 4),
                'rating_after' => round($afterA, 4),
                'rating_percentile' => round($percentileA, 4),
                'rating_confidence' => round($confidenceA, 4),
            ]);
            $rows[] = array_merge($common, [
                'team_id' => $teamB,
                'opponent_id' => $teamA,
                'rating_before' => round($ratingB, 4),
                'rating_after' => round($afterB, 4),
                'rating_percentile' => round($percentileB, 4),
                'rating_confidence' => round($confidenceB, 4),
            ]);

            $ratings[$teamA] = $afterA;
            $ratings[$teamB] = $afterB;
            $games[$teamA]++;
            $games[$teamB]++;
        }

        // Finalize Dynamic Regional Strength Matrix
        foreach ($regionalStats as $reg => &$stat) {
            $current = round($regionalElo[$reg], 2);
            $stat['current_elo'] = $current;
            $stat['strength_coefficient'] = round($current / 1500.0, 4);
            $stat['international_win_rate'] = $stat['international_matches'] > 0
                ? round(($stat['international_wins'] / $stat['international_matches']) * 100, 1)
                : 0.0;
        }
        unset($stat);

        uasort($regionalStats, fn (array $a, array $b): int => $b['current_elo'] <=> $a['current_elo']);
        $rank = 1;
        foreach ($regionalStats as &$stat) {
            $stat['rank'] = $rank++;
        }
        unset($stat);

        $this->regionalMatrix = array_values($regionalStats);
        Cache::forever('api_regional_strength_matrix', [
            'season' => $season,
            'method_version' => CompetitionQualityConfig::ELO_METHOD_VERSION,
            'updated_at' => now()->toIso8601String(),
            'regions' => $this->regionalMatrix,
        ]);

        return $rows;
    }

    /** @return array<int, array<string, mixed>> */
    public function getRegionalStrengthMatrix(): array
    {
        return $this->regionalMatrix;
    }

    /**
     * @param  array<int, array<string, mixed>>  $matches
     * @return array<string, string>
     */
    private function homeRegions(array $matches): array
    {
        $counts = [];
        foreach ($matches as $match) {
            $region = (string) ($match['event_region'] ?? '');
            if ($region === '' || $region === 'International') {
                continue;
            }
            $counts[(string) $match['team_a_id']][$region] = ($counts[(string) $match['team_a_id']][$region] ?? 0) + 1;
            $counts[(string) $match['team_b_id']][$region] = ($counts[(string) $match['team_b_id']][$region] ?? 0) + 1;
        }

        $regions = [];
        foreach ($counts as $teamId => $regionCounts) {
            arsort($regionCounts);
            $regions[$teamId] = (string) array_key_first($regionCounts);
        }

        return $regions;
    }

    /** @param array<string, float> $population */
    private function percentile(array $population, float $value): float
    {
        if ($population === []) {
            return 0.5;
        }

        $less = 0;
        $equal = 0;
        foreach ($population as $candidate) {
            if ($candidate < $value - 0.000001) {
                $less++;
            } elseif (abs($candidate - $value) <= 0.000001) {
                $equal++;
            }
        }

        return ($less + (0.5 * $equal)) / count($population);
    }
}
