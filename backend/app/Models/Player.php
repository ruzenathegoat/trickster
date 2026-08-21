<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    use HasUuids;

    const UPDATED_AT = null;

    protected $fillable = ['name', 'ign', 'country', 'team_id', 'current_role', 'vlr_player_id', 'photo_url', 'total_matches', 'total_wins', 'win_rate', 'avg_acs', 'avg_kd', 'avg_kast', 'avg_adr', 'avg_rating', 'total_kills', 'total_deaths', 'total_assists', 'consistency_index', 'consistency_provisional_index', 'consistency_sample_size', 'consistency_event_count', 'consistency_method', 'consistency_calculated_at', 'competition_quality_index', 'avg_fk', 'avg_fd', 'meta_alignment_score', 'flexibility_score', 'meta_adaptability_index', 'is_igl'];

    protected function casts(): array
    {
        return [
            'consistency_index' => 'float',
            'consistency_provisional_index' => 'float',
            'consistency_sample_size' => 'integer',
            'consistency_event_count' => 'integer',
            'consistency_calculated_at' => 'datetime',
        ];
    }

    protected $appends = ['playstyle_tags'];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function mapStats(): HasMany
    {
        return $this->hasMany(PlayerMapStat::class);
    }

    public function criteriaScores(): HasMany
    {
        return $this->hasMany(PlayerCriteriaScore::class);
    }

    public function smartResults(): HasMany
    {
        return $this->hasMany(PlayerSmartResult::class);
    }

    public function matchAgents(): HasMany
    {
        return $this->hasMany(PlayerMatchAgent::class);
    }

    public function getPlaystyleTagsAttribute(): array
    {
        $tags = [];
        if ($this->avg_fk > 0.15) {
            $tags[] = 'Aggressive';
        }
        if ($this->avg_kast > 74) {
            $tags[] = 'Supportive';
        }
        if ($this->avg_kd > 1.15) {
            $tags[] = 'Fragger';
        }
        if ($this->avg_fd < 0.11) {
            $tags[] = 'Anchor';
        }

        return $tags;
    }
}
