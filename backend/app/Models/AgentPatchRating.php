<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentPatchRating extends Model
{
    public $timestamps = false;
    protected $fillable = ['patch_id', 'agent', 'role', 'tier', 'direction', 'notes'];

    public function patch(): BelongsTo { return $this->belongsTo(Patch::class); }
}
