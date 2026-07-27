<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentMapRating extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['patch_id', 'agent', 'map', 'score', 'effective_date', 'source_reference', 'confidence_level', 'superseded_by_id'];

    public function patch(): BelongsTo { return $this->belongsTo(Patch::class); }
    public function supersededBy(): BelongsTo { return $this->belongsTo(AgentMapRating::class, 'superseded_by_id'); }
}
