<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmartWeightValue extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['profile_id', 'criteria_id', 'rank_position', 'computed_weight'];

    public function profile(): BelongsTo { return $this->belongsTo(SmartWeightProfile::class, 'profile_id'); }
    public function criteria(): BelongsTo { return $this->belongsTo(SmartCriteria::class, 'criteria_id'); }
}
