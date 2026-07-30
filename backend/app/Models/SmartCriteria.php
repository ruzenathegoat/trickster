<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmartCriteria extends Model
{
    protected $table = 'smart_criteria';
    public $timestamps = false;
    protected $fillable = ['name', 'type', 'description'];

    public function defaultFilters(): HasMany { return $this->hasMany(SmartFilterCriteria::class, 'criteria_id'); }
}
