<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmartFilterCriteria extends Model
{
    public $timestamps = false;
    protected $fillable = ['criteria_id', 'filter_type', 'default_value'];

    public function criteria(): BelongsTo { return $this->belongsTo(SmartCriteria::class, 'criteria_id'); }
}
