<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmartWeightProfile extends Model
{
    use HasUuids;
    const UPDATED_AT = null;
    protected $fillable = ['user_id', 'name', 'is_public'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function weightValues(): HasMany { return $this->hasMany(SmartWeightValue::class, 'profile_id'); }
    public function queryFilters(): HasMany { return $this->hasMany(SearchQueryFilter::class, 'profile_id'); }
}
