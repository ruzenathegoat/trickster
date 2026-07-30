<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerSmartResult extends Model
{
    const UPDATED_AT = null;
    const CREATED_AT = 'calculated_at';
    protected $fillable = ['player_id', 'profile_id', 'patch_id', 'mode', 'final_score', 'rank'];

    public function player(): BelongsTo { return $this->belongsTo(Player::class); }
    public function profile(): BelongsTo { return $this->belongsTo(SmartWeightProfile::class, 'profile_id'); }
    public function patch(): BelongsTo { return $this->belongsTo(Patch::class); }
}
