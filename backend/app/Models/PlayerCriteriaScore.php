<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerCriteriaScore extends Model
{
    const UPDATED_AT = null;
    const CREATED_AT = 'calculated_at';
    protected $fillable = ['player_id', 'criteria_id', 'patch_id', 'raw_value', 'global_normalized_utility', 'sample_size'];

    public function player(): BelongsTo { return $this->belongsTo(Player::class); }
    public function criteria(): BelongsTo { return $this->belongsTo(SmartCriteria::class, 'criteria_id'); }
    public function patch(): BelongsTo { return $this->belongsTo(Patch::class); }
}
