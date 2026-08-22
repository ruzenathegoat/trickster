<?php

namespace App\Services;

final class PreMatchEloCalculator
{
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
            $afterA = $ratingA + (CompetitionQualityConfig::ELO_K * ($scoreA - $expectedA));
            $afterB = $ratingB + (CompetitionQualityConfig::ELO_K * ($scoreB - $expectedB));

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

        return $rows;
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
