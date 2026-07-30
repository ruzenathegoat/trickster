<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Map extends Model
{
    public $timestamps = false;
    protected $fillable = ['match_id', 'map_name', 'valorant_map_name', 'winner_team_id', 'map_order'];

    public function matchData(): BelongsTo { return $this->belongsTo(MatchData::class, 'match_id'); }
    public function winnerTeam(): BelongsTo { return $this->belongsTo(Team::class, 'winner_team_id'); }
    public function playerStats(): \Illuminate\Database\Eloquent\Relations\HasMany { return $this->hasMany(PlayerMapStat::class); }
}
