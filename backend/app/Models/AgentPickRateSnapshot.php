<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentPickRateSnapshot extends Model
{
    protected $fillable = ['event_id', 'map_id', 'valorant_map_name', 'agent_name', 'pick_rate', 'total_picks', 'total_matches'];

    public function event(): BelongsTo { return $this->belongsTo(Event::class); }
    public function map(): BelongsTo { return $this->belongsTo(Map::class); }
}
