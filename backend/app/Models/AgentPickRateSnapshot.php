<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentPickRateSnapshot extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['patch_id', 'agent', 'map', 'region', 'pick_rate', 'win_rate', 'snapshot_date', 'source'];

    public function patch(): BelongsTo { return $this->belongsTo(Patch::class); }
}
