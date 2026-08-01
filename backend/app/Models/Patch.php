<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patch extends Model
{
    public $timestamps = false;
    protected $fillable = ['version', 'release_date', 'patch_notes_url'];

    public function matches(): HasMany { return $this->hasMany(MatchData::class); }
    public function agentPatchRatings(): HasMany { return $this->hasMany(AgentPatchRating::class); }
    public function agentMapRatings(): HasMany { return $this->hasMany(AgentMapRating::class); }
    public function pickRateSnapshots(): HasMany { return $this->hasMany(AgentPickRateSnapshot::class); }
    public function events() { return $this->belongsToMany(Event::class, 'patch_events', 'patch_id', 'event_id'); }
}
