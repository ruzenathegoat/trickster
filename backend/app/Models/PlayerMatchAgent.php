<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerMatchAgent extends Model
{
    protected $table = 'player_match_agents';
    protected $fillable = ['player_id', 'match_id', 'map_id', 'agent_name'];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function agent()
    {
        // Because the foreign key is 'agent_name' in player_match_agents and 'name' in valorant_agents
        return $this->belongsTo(ValorantAgent::class, 'agent_name', 'name');
    }
}
