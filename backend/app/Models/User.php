<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids, \Laravel\Sanctum\HasApiTokens;

    protected $fillable = ['name', 'email', 'password', 'role', 'theme_color', 'favorite_role', 'favorite_agent_id', 'profile_photo_path'];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array { return ['email_verified_at' => 'datetime', 'password' => 'hashed']; }
    
    protected $appends = ['profile_photo_url'];

    public function getProfilePhotoUrlAttribute()
    {
        return $this->profile_photo_path
                    ? url(\Illuminate\Support\Facades\Storage::url($this->profile_photo_path))
                    : null;
    }

    public function smartWeightProfiles(): HasMany { return $this->hasMany(SmartWeightProfile::class); }

    public function favoritePlayers() {
        return $this->belongsToMany(Player::class, 'user_favorite_players', 'user_id', 'player_id');
    }

    public function favoriteTeams() {
        return $this->belongsToMany(Team::class, 'user_favorite_teams', 'user_id', 'team_id');
    }

    public function savedSimulations() {
        return $this->hasMany(UserSavedSimulation::class, 'user_id', 'id');
    }
}
