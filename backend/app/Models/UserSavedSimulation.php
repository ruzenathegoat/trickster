<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSavedSimulation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'map_id',
        'team_data',
    ];

    protected $casts = [
        'team_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
