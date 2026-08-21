<?php

namespace App\Services;

use App\Models\Player;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class ConsistencyIndexService
{
    public function __construct(private readonly ConsistencyIndexCalculator $calculator) {}

    /**
     * Return exactly one valid All Maps observation per completed match.
     *
     * @return Collection<int, object>
     */
    public function validMatchStatsForPlayer(string $playerId): Collection
    {
        return DB::table('player_map_stats as pms')
            ->join('maps as ci_maps', 'ci_maps.id', '=', 'pms.map_id')
            ->join('matches as ci_matches', 'ci_matches.id', '=', 'pms.match_id')
            ->where('pms.player_id', $playerId)
            ->where('ci_maps.map_name', 'All Maps')
            ->whereNotNull('ci_matches.winner_team_id')
            ->whereNotNull('pms.acs')
            ->where('pms.acs', '>', 0)
            ->select('pms.*', 'ci_matches.event_id as source_event_id')
            ->orderByDesc('pms.id')
            ->get()
            ->unique('match_id')
            ->values();
    }

    /**
     * @return array{
     *     value: float|null,
     *     provisional_value: float|null,
     *     sample_size: int,
     *     event_count: int,
     *     eligible: bool,
     *     mean: float|null,
     *     standard_deviation: float|null,
     *     coefficient_of_variation: float|null,
     *     method: string,
     *     ineligibility_reason: string|null
     * }
     */
    public function calculateForStats(Collection $stats): array
    {
        $eventCount = $stats
            ->pluck('source_event_id')
            ->filter()
            ->unique()
            ->count();

        return $this->calculator->calculate($stats->pluck('acs'), $eventCount);
    }

    public function recalculate(Player $player): array
    {
        $result = $this->calculateForStats($this->validMatchStatsForPlayer($player->id));

        $player->update([
            'consistency_index' => $result['value'],
            'consistency_provisional_index' => $result['provisional_value'],
            'consistency_sample_size' => $result['sample_size'],
            'consistency_event_count' => $result['event_count'],
            'consistency_method' => $result['method'],
            'consistency_calculated_at' => now(),
        ]);

        return $result;
    }
}
