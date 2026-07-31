<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$teams = \App\Models\Team::all();
foreach ($teams as $team) {
    $totalMatches = \App\Models\MatchData::where(function ($q) use ($team) {
        $q->where('team_a_id', $team->id)->orWhere('team_b_id', $team->id);
    })->whereNotNull('winner_team_id')->count();

    $totalWins = \App\Models\MatchData::where('winner_team_id', $team->id)->count();

    $winRate = $totalMatches > 0 ? round(($totalWins / $totalMatches) * 100, 2) : null;
    
    $team->update([
        'win_rate_2026' => $winRate,
    ]);
}
echo "Done!\n";
