<?php

namespace App\Console\Commands;

use App\Jobs\CalculateSmartJob;
use App\Services\CompetitionQualityService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RecalculateCompetitionQuality extends Command
{
    protected $signature = 'metrics:recalculate-competition-quality
                            {season? : Four-digit season; defaults to the latest completed match}
                            {--no-smart : Do not refresh SMART results after CQI}';

    protected $description = 'Rebuild CQI v2, consistency percentiles, and proven consistency in bulk';

    public function handle(CompetitionQualityService $competitionQuality): int
    {
        $season = $this->argument('season');
        $season = $season === null ? $competitionQuality->latestSeason() : (int) $season;
        if ($season === null) {
            $this->error('No completed match season is available.');

            return self::FAILURE;
        }

        if ($season < 2000 || $season > 2100) {
            $this->error('Season must be a four-digit year.');

            return self::FAILURE;
        }

        $this->info("Recalculating CQI v2 for {$season}...");
        $summary = $competitionQuality->recalculateSeason($season);

        if (! $this->option('no-smart')) {
            $playerIds = DB::table('player_competition_metrics')
                ->where('season', $season)
                ->pluck('player_id')
                ->all();

            if ($playerIds !== []) {
                CalculateSmartJob::dispatchSync(
                    'competition-quality-v2-'.$season,
                    $playerIds,
                    false
                );
            }
        }

        $this->table(
            ['Season', 'Matches', 'Player matches', 'Players', 'Eligible', 'Method'],
            [[
                $summary['season'],
                $summary['matches'],
                $summary['player_match_observations'] ?? 0,
                $summary['players'],
                $summary['eligible_players'],
                $summary['method_version'],
            ]]
        );

        return self::SUCCESS;
    }
}
