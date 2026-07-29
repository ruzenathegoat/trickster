<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ValorantMap extends Model
{
    use HasUuids;
    protected $fillable = ['name', 'is_active'];
}
