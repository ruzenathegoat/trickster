<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerMapStat extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['match_id', 'player_id', 'map_id', 'agent_played', 'kills', 'deaths', 'assists', 'acs', 'kast', 'adr', 'kd', 'rating', 'fk', 'fd'];

    public function player(): BelongsTo { return $this->belongsTo(Player::class); }
    public function map(): BelongsTo { return $this->belongsTo(Map::class); }
}
