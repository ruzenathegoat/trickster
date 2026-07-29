<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatchMapPool extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['patch_id', 'map_name'];

    public function patch(): BelongsTo { return $this->belongsTo(Patch::class); }
}
