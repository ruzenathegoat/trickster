<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentRoleMap extends Model
{
    protected $table = 'agent_role_map';
    protected $primaryKey = 'agent';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['agent', 'primary_role', 'secondary_role'];
}
