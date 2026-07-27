<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['name', 'region', 'logo_url', 'vlr_team_id'];

    public function players(): HasMany { return $this->hasMany(Player::class); }
    public function matchesAsTeamA(): HasMany { return $this->hasMany(MatchData::class, 'team_a_id'); }
    public function matchesAsTeamB(): HasMany { return $this->hasMany(MatchData::class, 'team_b_id'); }
}
