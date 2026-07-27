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
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'user',
        ]);

        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

        $patch = Patch::create(['version' => '9.08', 'release_date' => '2026-05-01']);
        $event = Event::create(['name' => 'VCT Masters 2026', 'tier' => 'vct_international', 'vlr_event_id' => '999']);

        $teamSEN = Team::create(['name' => 'Sentinels', 'region' => 'NA', 'vlr_team_id' => '111']);
        $teamPRX = Team::create(['name' => 'Paper Rex', 'region' => 'APAC', 'vlr_team_id' => '222']);

        $players = [
            ['name' => 'Tyson Ngo', 'ign' => 'TenZ', 'team_id' => $teamSEN->id, 'current_role' => 'flex', 'vlr_player_id' => '9'],
            ['name' => 'Zachary Patrone', 'ign' => 'zekken', 'team_id' => $teamSEN->id, 'current_role' => 'duelist', 'vlr_player_id' => '4004'],
            ['name' => 'Ilya Petrov', 'ign' => 'something', 'team_id' => $teamPRX->id, 'current_role' => 'duelist', 'vlr_player_id' => '11111'],
        ];

        $playerModels = [];
        foreach ($players as $p) {
            $playerModels[] = Player::create($p);
        }

        $criteriaData = [
            ['name' => 'Average Combat Score (ACS)', 'type' => 'benefit'],
            ['name' => 'KAST %', 'type' => 'benefit'],
            ['name' => 'Tournament Pressure', 'type' => 'benefit'],
            ['name' => 'First Death Rate', 'type' => 'cost'],
        ];

        $criteriaModels = [];
        foreach ($criteriaData as $c) {
            $criteriaModels[] = SmartCriteria::create($c);
        }

        foreach ($playerModels as $player) {
            foreach ($criteriaModels as $criteria) {
                PlayerCriteriaScore::create([
                    'player_id' => $player->id,
                    'criteria_id' => $criteria->id,
                    'patch_id' => $patch->id,
                    'raw_value' => rand(150, 280) + (rand(0, 99) / 100),
                    'sample_size' => rand(10, 30),
                ]);
            }
        }
    }
}
