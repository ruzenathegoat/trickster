<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StageFormatProfile extends Model
{
    protected $fillable = [
        'key',
        'display_name',
        'competition_level',
        'valid_from_season',
        'valid_to_season',
        'evidence_cap',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'valid_from_season' => 'integer',
            'valid_to_season' => 'integer',
            'evidence_cap' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function mappings(): HasMany
    {
        return $this->hasMany(StageLabelMapping::class);
    }
}
