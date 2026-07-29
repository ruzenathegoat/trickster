<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AgentRoleMapSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('agent_role_maps')->truncate();

        $agents = [
            // Duelists
            'Jett' => 'Duelist',
            'Raze' => 'Duelist',
            'Phoenix' => 'Duelist',
            'Reyna' => 'Duelist',
            'Yoru' => 'Duelist',
            'Neon' => 'Duelist',
            'Iso' => 'Duelist',

            // Initiators
            'Sova' => 'Initiator',
            'Breach' => 'Initiator',
            'Skye' => 'Initiator',
            'KAY/O' => 'Initiator',
            'Fade' => 'Initiator',
            'Gekko' => 'Initiator',

            // Controllers
            'Omen' => 'Controller',
            'Brimstone' => 'Controller',
            'Viper' => 'Controller',
            'Astra' => 'Controller',
            'Harbor' => 'Controller',
            'Clove' => 'Controller',
            'Vyse' => 'Sentinel', // Actually Vyse is a sentinel but let's just make sure. Wait, Vyse is a Sentinel.

            // Sentinels
            'Killjoy' => 'Sentinel',
            'Cypher' => 'Sentinel',
            'Sage' => 'Sentinel',
            'Chamber' => 'Sentinel',
            'Deadlock' => 'Sentinel',
        ];

        $insertData = [];
        foreach ($agents as $agent => $role) {
            $insertData[] = [
                'id' => Str::uuid()->toString(),
                'agent_name' => strtolower($agent),
                'role_name' => strtolower($role),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('agent_role_maps')->insert($insertData);
    }
}
