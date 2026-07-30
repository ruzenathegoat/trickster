<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UpdateSmartCriteriaSeeder extends Seeder
{
    public function run(): void
    {
        // Clear old criteria and dependent tables
        DB::table('player_criteria_scores')->truncate();
        DB::table('player_smart_results')->truncate();
        DB::table('smart_weight_values')->truncate();
        DB::table('smart_criteria')->delete();

        $criteria = [
            [
                'name' => 'Average Combat Score (ACS)',
                'type' => 'benefit',
                'description' => 'Higher ACS is better'
            ],
            [
                'name' => 'KAST %',
                'type' => 'benefit',
                'description' => 'Higher KAST is better'
            ],
            [
                'name' => 'Kill/Death Ratio (KD)',
                'type' => 'benefit',
                'description' => 'Higher KD is better'
            ],
            [
                'name' => 'Average Damage per Round (ADR)',
                'type' => 'benefit',
                'description' => 'Higher ADR is better'
            ],
            [
                'name' => 'Consistency Index',
                'type' => 'benefit',
                'description' => 'Higher consistency index is better'
            ],
            [
                'name' => 'Tournament Pressure',
                'type' => 'benefit',
                'description' => 'Higher tournament pressure is better'
            ],
            [
                'name' => 'First Death Rate',
                'type' => 'cost',
                'description' => 'Lower first death rate is better'
            ]
        ];

        DB::table('smart_criteria')->insert($criteria);
        
        // Also seed some default SmartWeightProfiles so we can test it
        DB::table('smart_weight_profiles')->truncate();
        
        $admin = DB::table('users')->first();
        if (!$admin) {
            $adminId = Str::uuid()->toString();
            DB::table('users')->insert([
                'id' => $adminId,
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
            ]);
        } else {
            $adminId = $admin->id;
        }

        $profileId = Str::uuid()->toString();
        DB::table('smart_weight_profiles')->insert([
            'id' => $profileId,
            'name' => 'Balanced Profile',
            'user_id' => $adminId,
            'is_public' => true,
            'created_at' => now(),
        ]);
        
        // Distribute weights equally
        $criteriaRecords = DB::table('smart_criteria')->get();
        $weight = 1.0 / count($criteriaRecords);
        
        $weightValues = [];
        $rank = 1;
        foreach ($criteriaRecords as $c) {
            $weightValues[] = [
                'profile_id' => $profileId,
                'criteria_id' => $c->id,
                'rank_position' => $rank++,
                'computed_weight' => $weight,
            ];
        }
        
        DB::table('smart_weight_values')->insert($weightValues);
    }
}
