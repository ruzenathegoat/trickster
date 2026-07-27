<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerMapStat extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['player_id', 'map_id', 'role_at_time_of_match', 'agent_played', 'acs', 'kast', 'adr', 'kd', 'first_kills', 'first_deaths', 'clutch_wins', 'rating'];

    public function player(): BelongsTo { return $this->belongsTo(Player::class); }
    public function map(): BelongsTo { return $this->belongsTo(Map::class); }
}
