<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StageLabelMapping extends Model
{
    protected $table = 'stage_label_mapping';

    protected $fillable = [
        'stage_format_profile_id',
        'raw_label',
        'label_operator',
        'canonical_label',
        'normalized_stage',
        'phase',
        'bracket',
        'round_number',
        'is_elimination_match',
        'is_qualification_match',
        'quality_weight',
        'consistency_evidence_weight',
        'priority',
        'source',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'round_number' => 'integer',
            'is_elimination_match' => 'boolean',
            'is_qualification_match' => 'boolean',
            'quality_weight' => 'float',
            'consistency_evidence_weight' => 'float',
            'priority' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(StageFormatProfile::class, 'stage_format_profile_id');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(MatchData::class, 'stage_label_id');
    }
}
