<?php

namespace App\Jobs;

use App\Models\MatchData;
use App\Models\Player;
use App\Services\ConsistencyIndexService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

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

    public function handle(ConsistencyIndexService $consistencyIndexService): void
    {
        foreach ($this->players as $playerModel) {
            $player = Player::find($playerModel->id);
            if (! $player) {
                continue;
            }

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

            // Calculate Current Role
            $agentPicks = DB::table('player_match_agents')
                ->join('matches', 'player_match_agents.match_id', '=', 'matches.id')
                ->where('player_match_agents.player_id', $player->id)
                ->select('player_match_agents.agent_name', 'matches.event_id', DB::raw('count(*) as count'))
                ->groupBy('player_match_agents.agent_name', 'matches.event_id')
                ->get();

            $currentRole = null;
            if ($agentPicks->isNotEmpty()) {
                $rolesPerEvent = [];
                $overallRoles = [];

                foreach ($agentPicks as $pick) {
                    $roleRecord = DB::table('agent_role_maps')
                        ->where('agent_name', strtolower($pick->agent_name))
                        ->first();

                    if ($roleRecord) {
                        $roleName = ucfirst($roleRecord->role_name);

                        // Track per event
                        $eventId = $pick->event_id;
                        if (! isset($rolesPerEvent[$eventId])) {
                            $rolesPerEvent[$eventId] = [];
                        }
                        $rolesPerEvent[$eventId][$roleName] = true;

                        // Track overall
                        if (! isset($overallRoles[$roleName])) {
                            $overallRoles[$roleName] = 0;
                        }
                        $overallRoles[$roleName] += $pick->count;
                    }
                }

                $isFlex = false;
                foreach ($rolesPerEvent as $eventId => $roles) {
                    if (count($roles) > 2) { // Played more than 2 distinct roles in this event
                        $isFlex = true;
                        break;
                    }
                }

                if ($isFlex) {
                    $currentRole = 'Flex';
                } elseif (count($overallRoles) > 0) {
                    arsort($overallRoles);
                    $currentRole = array_key_first($overallRoles);
                }
            }

            $player->update([
                'total_matches' => $totalMatches,
                'total_wins' => $totalWins,
                'win_rate' => $totalMatches > 0 ? round(($totalWins / $totalMatches) * 100, 2) : 0,
                'avg_acs' => round($stats->avg('acs'), 1),
                'avg_kd' => $totalDeaths > 0 ? round($totalKills / $totalDeaths, 2) : $totalKills,
                'avg_kast' => round($stats->avg('kast'), 1),
                'avg_adr' => round($stats->avg('adr'), 1),
                'avg_rating' => round($stats->filter(fn ($s) => $s->rating > 0)->avg('rating') ?? 0, 2),
                'total_kills' => $totalKills,
                'total_deaths' => $totalDeaths,
                'total_assists' => $totalAssists,
                'avg_fk' => round($stats->avg('fk'), 2),
                'avg_fd' => round($stats->avg('fd'), 2),
                'consistency_index' => $consistency['value'],
                'consistency_provisional_index' => $consistency['provisional_value'],
                'consistency_sample_size' => $consistency['sample_size'],
                'consistency_event_count' => $consistency['event_count'],
                'consistency_method' => $consistency['method'],
                'consistency_calculated_at' => now(),
                'current_role' => $currentRole ?? $player->current_role,
            ]);
        }
        if ($this->dispatchDownstream) {
            // Calculate Meta Adaptability Index for the involved players first
            CalculateMetaAdaptabilityJob::dispatch($this->players)->onQueue('scrape-default');

            // CQI v2 is a season-wide percentile model. Rebuild it once in a
            // unique bulk job, then that job refreshes SMART for the cohort.
            $matchDate = MatchData::where('id', $this->matchId)->value('match_date');
            $season = $matchDate ? (int) substr((string) $matchDate, 0, 4) : (int) now()->format('Y');
            RecalculateCompetitionQualityJob::dispatch($season)->onQueue('scrape-default');
        }
    }
}
