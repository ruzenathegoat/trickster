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
                'name' => 'Consistency Index',
                'type' => 'benefit',
                'description' => 'Higher consistency index is better',
                'weight' => 0.20, // custom property for seeding
            ],
            [
                'name' => 'Competition Quality Index',
                'type' => 'benefit',
                'description' => 'Higher CQI indicates matches played in higher difficulty regions (International > Americas > Pacific > EMEA > China)',
                'weight' => 0.15,
            ],
            [
                'name' => 'Kill/Death Ratio (KD)',
                'type' => 'benefit',
                'description' => 'Higher KD is better',
                'weight' => 0.13,
            ],
            [
                'name' => 'KAST %',
                'type' => 'benefit',
                'description' => 'Higher KAST is better',
                'weight' => 0.12,
            ],
            [
                'name' => 'First Death Rate',
                'type' => 'cost',
                'description' => 'Lower first death rate is better',
                'weight' => 0.11,
            ],
            [
                'name' => 'Average Combat Score (ACS)',
                'type' => 'benefit',
                'description' => 'Higher ACS is better',
                'weight' => 0.10,
            ],
            [
                'name' => 'Average Damage per Round (ADR)',
                'type' => 'benefit',
                'description' => 'Higher ADR is better',
                'weight' => 0.10,
            ],
            [
                'name' => 'Meta Adaptability Index',
                'type' => 'benefit',
                'description' => 'Higher adaptability to map metas is better',
                'weight' => 0.09,
            ]
        ];

        // Insert criteria (without the temporary weight property)
        $insertData = array_map(function($c) {
            return [
                'name' => $c['name'],
                'type' => $c['type'],
                'description' => $c['description']
            ];
        }, $criteria);
        
        DB::table('smart_criteria')->insert($insertData);
        
        // Also seed default SmartWeightProfile
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
        
        // Distribute specific weights based on rank
        $criteriaRecords = DB::table('smart_criteria')->get();
        
        $weightValues = [];
        $rank = 1;
        
        // Sort original criteria array by weight descending to assign ranks
        usort($criteria, function($a, $b) {
            return $b['weight'] <=> $a['weight'];
        });

        foreach ($criteria as $c) {
            $dbRecord = $criteriaRecords->where('name', $c['name'])->first();
            
            $weightValues[] = [
                'profile_id' => $profileId,
                'criteria_id' => $dbRecord->id,
                'rank_position' => $rank++,
                'computed_weight' => $c['weight'],
            ];
        }
        
        DB::table('smart_weight_values')->insert($weightValues);
    }
}
