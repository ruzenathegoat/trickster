<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Team;
use App\Models\Player;
use App\Models\Patch;
use App\Models\Event;
use App\Models\SmartCriteria;
use App\Models\PlayerCriteriaScore;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => bcrypt('password'), 'role' => 'user']
        );

        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin User', 'password' => bcrypt('password'), 'role' => 'admin']
        );
        
        $this->call([
            AgentRoleMapSeeder::class,
            UpdateSmartCriteriaSeeder::class,
            PatchSeeder::class,
        ]);
    }
}
