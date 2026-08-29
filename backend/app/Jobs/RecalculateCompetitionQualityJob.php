<?php

namespace App\Jobs;

use App\Models\MetricCalculationRun;
use App\Services\CompetitionQualityConfig;
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

    public function __construct(
        public readonly int $season,
        public readonly ?string $runId = null,
    ) {}

    public function uniqueId(): string
    {
        return (string) $this->season;
    }

    public function handle(CompetitionQualityService $competitionQuality): void
    {
        $run = $this->runId === null ? null : MetricCalculationRun::find($this->runId);
        $run?->update([
            'status' => 'running',
            'method_version' => CompetitionQualityConfig::METHOD_VERSION,
            'started_at' => now(),
            'error' => null,
        ]);

        $summary = $competitionQuality->recalculateSeason($this->season);

        $playerIds = DB::table('player_competition_metrics')
            ->where('season', $this->season)
            ->pluck('player_id')
            ->all();

        if ($playerIds !== []) {
            if ($run !== null) {
                CalculateSmartJob::dispatchSync(
                    CompetitionQualityConfig::METHOD_VERSION.'-'.$this->season,
                    $playerIds,
                    false
                );
            } else {
                CalculateSmartJob::dispatch(
                    CompetitionQualityConfig::METHOD_VERSION.'-'.$this->season,
                    $playerIds,
                    false
                )->onQueue('scrape-default');
            }
        }

        $run?->update([
            'status' => 'completed',
            'summary' => $summary,
            'completed_at' => now(),
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        if ($this->runId === null) {
            return;
        }

        MetricCalculationRun::find($this->runId)?->update([
            'status' => 'failed',
            'error' => mb_substr($exception->getMessage(), 0, 5000),
            'completed_at' => now(),
        ]);
    }
}
