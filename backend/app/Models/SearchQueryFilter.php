<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchQueryFilter extends Model
{
    public $timestamps = false;
    protected $fillable = ['profile_id', 'criteria_id', 'operator', 'value'];

    public function profile(): BelongsTo { return $this->belongsTo(SmartWeightProfile::class, 'profile_id'); }
    public function criteria(): BelongsTo { return $this->belongsTo(SmartCriteria::class, 'criteria_id'); }
}
