<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MatchData extends Model
{
    use HasUuids;
    protected $table = 'matches';
    public $timestamps = false;
    protected $fillable = ['event_id', 'team_a_id', 'team_b_id', 'winner_team_id', 'patch_id', 'stage_label_id', 'match_date', 'best_of', 'raw_stage_label', 'vlr_match_id'];

    public function event(): BelongsTo { return $this->belongsTo(Event::class); }
    public function teamA(): BelongsTo { return $this->belongsTo(Team::class, 'team_a_id'); }
    public function teamB(): BelongsTo { return $this->belongsTo(Team::class, 'team_b_id'); }
    public function patch(): BelongsTo { return $this->belongsTo(Patch::class); }
    public function stageLabelMapping(): BelongsTo { return $this->belongsTo(StageLabelMapping::class, 'stage_label_id'); }
    public function maps(): HasMany { return $this->hasMany(Map::class, 'match_id'); }
}
