<?php

namespace App\Jobs;

use App\Services\CompetitionQualityService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class RecalculateCompetitionQualityJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $uniqueFor = 600;

    public function __construct(public readonly int $season) {}

    public function uniqueId(): string
    {
        return (string) $this->season;
    }

    public function handle(CompetitionQualityService $competitionQuality): void
    {
        $competitionQuality->recalculateSeason($this->season);

        $playerIds = DB::table('player_competition_metrics')
            ->where('season', $this->season)
            ->pluck('player_id')
            ->all();

        if ($playerIds !== []) {
            CalculateSmartJob::dispatch(
                'competition-quality-v2-'.$this->season,
                $playerIds,
                false
            )->onQueue('scrape-default');
        }
    }
}
