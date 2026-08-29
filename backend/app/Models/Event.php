<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'name', 'tier', 'region', 'season', 'start_date', 'end_date', 'vlr_event_id',
        'competition_level', 'competition_base_weight', 'stage_format_profile_id',
        'stage_profile_source', 'stage_profile_resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'competition_base_weight' => 'float',
            'stage_profile_resolved_at' => 'datetime',
        ];
    }

    public function matches(): HasMany
    {
        return $this->hasMany(MatchData::class);
    }

    public function matchScrapeQueues(): HasMany
    {
        return $this->hasMany(MatchScrapeQueue::class, 'vlr_event_id', 'vlr_event_id');
    }

    public function patches()
    {
        return $this->belongsToMany(Patch::class, 'patch_events', 'event_id', 'patch_id');
    }

    public function stageFormatProfile(): BelongsTo
    {
        return $this->belongsTo(StageFormatProfile::class);
    }
}
