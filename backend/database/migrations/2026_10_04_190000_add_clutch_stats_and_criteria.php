<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const BALANCED_WEIGHTS_10 = [
        'Consistency Percentile' => 0.1400,
        'Kill/Death Ratio (KD)' => 0.1300,
        'KAST %' => 0.1200,
        'First Death Rate' => 0.1100,
        'Average Combat Score (ACS)' => 0.1000,
        'Average Damage per Round (ADR)' => 0.1000,
        'Meta Adaptability Index' => 0.0900,
        'Clutch Factor' => 0.0700,
        'Proven Consistency' => 0.0700,
        'CQI / Competition Exposure' => 0.0700,
    ];

    public function up(): void
    {
        // 1. Add clutch columns to player_map_stats
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->integer('clutch_1v1')->default(0)->after('fd');
            $table->integer('clutch_1v2')->default(0)->after('clutch_1v1');
            $table->integer('clutch_1v3')->default(0)->after('clutch_1v2');
            $table->integer('clutch_1v4')->default(0)->after('clutch_1v3');
            $table->integer('clutch_1v5')->default(0)->after('clutch_1v4');
            $table->integer('clutches_won')->default(0)->after('clutch_1v5');
            $table->decimal('clutch_points', 6, 2)->default(0)->after('clutches_won');
        });

        // 2. Add aggregate clutch columns to players
        Schema::table('players', function (Blueprint $table) {
            $table->integer('total_clutches_won')->default(0)->after('avg_fd');
            $table->decimal('avg_clutch_factor', 6, 2)->default(0)->after('total_clutches_won');
        });

        // 3. Register Clutch Factor in smart_criteria
        DB::table('smart_criteria')->updateOrInsert(
            ['name' => 'Clutch Factor'],
            [
                'type' => 'benefit',
                'description' => 'Role-normalized Bayesian shrinkage of weighted 1vX clutch conversion rate',
            ]
        );

        // 4. Update Balanced Profile weights
        $criteria = DB::table('smart_criteria')->pluck('id', 'name');
        $profiles = DB::table('smart_weight_profiles')->get();

        foreach ($profiles as $profile) {
            if ($profile->name !== 'Balanced Profile') {
                if (isset($criteria['Clutch Factor'])) {
                    DB::table('smart_weight_values')->updateOrInsert(
                        [
                            'profile_id' => $profile->id,
                            'criteria_id' => $criteria['Clutch Factor'],
                        ],
                        [
                            'rank_position' => null,
                            'computed_weight' => 0,
                        ]
                    );
                }
                continue;
            }

            $rank = 1;
            foreach (self::BALANCED_WEIGHTS_10 as $criterionName => $weight) {
                if (! isset($criteria[$criterionName])) {
                    continue;
                }

                DB::table('smart_weight_values')->updateOrInsert(
                    [
                        'profile_id' => $profile->id,
                        'criteria_id' => $criteria[$criterionName],
                    ],
                    [
                        'rank_position' => $rank++,
                        'computed_weight' => $weight,
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        $clutchCriterionId = DB::table('smart_criteria')->where('name', 'Clutch Factor')->value('id');
        if ($clutchCriterionId !== null) {
            DB::table('smart_weight_values')->where('criteria_id', $clutchCriterionId)->delete();
            DB::table('smart_criteria')->where('id', $clutchCriterionId)->delete();
        }

        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn(['total_clutches_won', 'avg_clutch_factor']);
        });

        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->dropColumn([
                'clutch_1v1',
                'clutch_1v2',
                'clutch_1v3',
                'clutch_1v4',
                'clutch_1v5',
                'clutches_won',
                'clutch_points',
            ]);
        });
    }
};
