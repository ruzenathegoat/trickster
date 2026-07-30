<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ValorantAgent extends Model
{
    protected $fillable = ['name', 'role', 'icon_url', 'portrait_url', 'api_uuid'];
}
