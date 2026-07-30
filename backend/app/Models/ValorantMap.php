<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ValorantMap extends Model
{
    protected $fillable = ['name', 'is_active', 'uuid', 'display_icon', 'list_view_icon', 'splash_url'];
}
