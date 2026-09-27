<?php

namespace App\Jobs;

use App\Models\MatchData;
use App\Models\Player;
use App\Services\ConsistencyIndexService;
use App\Services\PlayerRoleProfileService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CalculateMetricJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $matchId;

    public $players;

    public $dispatchDownstream;

    public function __construct(string $matchId, array $players, bool $dispatchDownstream = true)
    {
        $this->matchId = $matchId;
        $this->players = $players;
        $this->dispatchDownstream = $dispatchDownstream;
    }

    public function handle(
        ConsistencyIndexService $consistencyIndexService,
        PlayerRoleProfileService $roleProfileService
    ): void {
        foreach ($this->players as $playerModel) {
            $player = Player::find($playerModel->id);
            if (! $player) {
                continue;
            }

            $roleProfileService->refresh($player);

            // One completed-match aggregate per player is the canonical grain.
            // Invalid ACS rows are excluded from every aggregate until rescraped.
            $stats = $consistencyIndexService->validMatchStatsForPlayer($player->id);
            $consistency = $consistencyIndexService->calculateForStats($stats);

            if ($stats->isEmpty()) {
                $player->update([
                    'total_matches' => 0,
                    'total_wins' => 0,
                    'win_rate' => 0,
                    'avg_acs' => 0,
                    'avg_kd' => 0,
                    'avg_kast' => 0,
                    'avg_adr' => 0,
                    'avg_rating' => 0,
                    'total_kills' => 0,
                    'total_deaths' => 0,
                    'total_assists' => 0,
                    'avg_fk' => 0,
                    'avg_fd' => 0,
                    'consistency_index' => null,
                    'consistency_provisional_index' => null,
                    'consistency_sample_size' => 0,
                    'consistency_event_count' => 0,
                    'consistency_method' => $consistency['method'],
                    'consistency_calculated_at' => now(),
                    'competition_quality_index' => null,
                ]);

                continue;
            }

            $totalMatches = $stats->count();
            $totalKills = $stats->sum('kills');
            $totalDeaths = $stats->sum('deaths');
            $totalAssists = $stats->sum('assists');

            // Count wins: matches where this player's team won
            $matchIds = $stats->pluck('match_id')->unique();
            $totalWins = MatchData::whereIn('id', $matchIds)
                ->where('winner_team_id', $player->team_id)
                ->count();

            // QMI Micro-Weighting: Weight observations by the match's Quality Match Index
            $weightSum = 0.0;
            $wAcs = 0.0;
            $wAdr = 0.0;
            $wKast = 0.0;
            $wKills = 0.0;
            $wDeaths = 0.0;
            $wFk = 0.0;
            $wFd = 0.0;
            $wRatingSum = 0.0;
            $wRatingWeight = 0.0;

            foreach ($stats as $s) {
                $w = max(0.5, (float) ($s->match_quality ?? 3.0));
                $weightSum += $w;
                $wAcs += ($w * (float) $s->acs);
                $wAdr += ($w * (float) ($s->adr ?? 0));
                $wKast += ($w * (float) ($s->kast ?? 0));
                $wKills += ($w * (int) ($s->kills ?? 0));
                $wDeaths += ($w * (int) ($s->deaths ?? 0));
                $wFk += ($w * (float) ($s->fk ?? 0));
                $wFd += ($w * (float) ($s->fd ?? 0));

                if (isset($s->rating) && (float) $s->rating > 0) {
                    $wRatingSum += ($w * (float) $s->rating);
                    $wRatingWeight += $w;
                }
            }

            $avgAcs = $weightSum > 0 ? round($wAcs / $weightSum, 1) : round($stats->avg('acs'), 1);
            $avgKd = $wDeaths > 0 ? round($wKills / $wDeaths, 2) : ($totalDeaths > 0 ? round($totalKills / $totalDeaths, 2) : (float) $totalKills);
            $avgKast = $weightSum > 0 ? round($wKast / $weightSum, 1) : round($stats->avg('kast'), 1);
            $avgAdr = $weightSum > 0 ? round($wAdr / $weightSum, 1) : round($stats->avg('adr'), 1);
            $avgRating = $wRatingWeight > 0 ? round($wRatingSum / $wRatingWeight, 2) : round($stats->filter(fn ($s) => $s->rating > 0)->avg('rating') ?? 0, 2);
            $avgFk = $weightSum > 0 ? round($wFk / $weightSum, 2) : round($stats->avg('fk'), 2);
            $avgFd = $weightSum > 0 ? round($wFd / $weightSum, 2) : round($stats->avg('fd'), 2);

            $player->update([
                'total_matches' => $totalMatches,
                'total_wins' => $totalWins,
                'win_rate' => $totalMatches > 0 ? round(($totalWins / $totalMatches) * 100, 2) : 0,
                'avg_acs' => $avgAcs,
                'avg_kd' => $avgKd,
                'avg_kast' => $avgKast,
                'avg_adr' => $avgAdr,
                'avg_rating' => $avgRating,
                'total_kills' => $totalKills,
                'total_deaths' => $totalDeaths,
                'total_assists' => $totalAssists,
                'avg_fk' => $avgFk,
                'avg_fd' => $avgFd,
                'consistency_index' => $consistency['value'],
                'consistency_provisional_index' => $consistency['provisional_value'],
                'consistency_sample_size' => $consistency['sample_size'],
                'consistency_event_count' => $consistency['event_count'],
                'consistency_method' => $consistency['method'],
                'consistency_calculated_at' => now(),
            ]);
        }
        if ($this->dispatchDownstream) {
            // Calculate Meta Adaptability Index for the involved players first
            CalculateMetaAdaptabilityJob::dispatch($this->players)->onQueue('scrape-default');

            // CQI v2 is a season-wide percentile model. Rebuild it once in a
            // unique bulk job, then that job refreshes SMART for the cohort.
            $matchDate = MatchData::where('vlr_match_id', $this->matchId)->value('match_date');
            $season = $matchDate ? (int) substr((string) $matchDate, 0, 4) : (int) now()->format('Y');
            RecalculateCompetitionQualityJob::dispatch($season)->onQueue('scrape-default');
        }
    }
}
