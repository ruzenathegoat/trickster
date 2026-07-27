<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Map extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['match_id', 'map_name', 'winner_team_id', 'map_order'];

    public function matchData(): BelongsTo { return $this->belongsTo(MatchData::class, 'match_id'); }
    public function winnerTeam(): BelongsTo { return $this->belongsTo(Team::class, 'winner_team_id'); }
    public function playerStats(): HasMany { return $this->hasMany(PlayerMapStat::class); }
}
