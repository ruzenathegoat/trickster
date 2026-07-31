<?php
$matchIdsWithNullWinner = App\Models\MatchData::whereNull('winner_team_id')->pluck('vlr_match_id')->toArray();
$matchIdsWithStats = DB::table('player_map_stats')
    ->join('matches', 'player_map_stats.match_id', '=', 'matches.id')
    ->pluck('matches.vlr_match_id')
    ->unique()
    ->toArray();

$incompleteMatchIds = App\Models\MatchScrapeQueue::whereNotIn('vlr_match_id', $matchIdsWithStats)
    ->orWhereIn('vlr_match_id', $matchIdsWithNullWinner)
    ->pluck('vlr_match_id')
    ->toArray();

$updated = App\Models\MatchScrapeQueue::whereIn('vlr_match_id', $incompleteMatchIds)
    ->update(['status' => 'pending', 'error_message' => null]);

echo "Updated " . $updated . " matches to pending.\n";
