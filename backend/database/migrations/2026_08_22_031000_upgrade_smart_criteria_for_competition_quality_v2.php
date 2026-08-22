<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var array<string, float> */
    private const BALANCED_WEIGHTS = [
        'Consistency Percentile' => 0.1500,
        'Kill/Death Ratio (KD)' => 0.1400,
        'KAST %' => 0.1292,
        'First Death Rate' => 0.1185,
        'Average Combat Score (ACS)' => 0.1077,
        'Average Damage per Round (ADR)' => 0.1077,
        'Meta Adaptability Index' => 0.0969,
        'Proven Consistency' => 0.0800,
        'CQI / Competition Exposure' => 0.0700,
    ];

    public function up(): void
    {
        DB::transaction(function (): void {
            DB::table('smart_criteria')
                ->where('name', 'Consistency Index')
                ->update([
                    'name' => 'Consistency Percentile',
                    'description' => 'Role-normalized season percentile of low per-match performance dispersion',
                ]);

            DB::table('smart_criteria')
                ->where('name', 'Competition Quality Index')
                ->update([
                    'name' => 'CQI / Competition Exposure',
                    'description' => 'Season percentile of opponent- and stage-adjusted competition exposure',
                ]);

            DB::table('smart_criteria')->updateOrInsert(
                ['name' => 'Proven Consistency'],
                [
                    'type' => 'benefit',
                    'description' => 'Geometric interaction of consistency, competition exposure, and quality-weighted performance',
                ]
            );

            $criteria = DB::table('smart_criteria')->pluck('id', 'name');
            $profiles = DB::table('smart_weight_profiles')->get();

            foreach ($profiles as $profile) {
                if ($profile->name !== 'Balanced Profile') {
                    DB::table('smart_weight_values')->updateOrInsert(
                        [
                            'profile_id' => $profile->id,
                            'criteria_id' => $criteria['Proven Consistency'],
                        ],
                        [
                            'rank_position' => null,
                            'computed_weight' => 0,
                        ]
                    );

                    continue;
                }

                $rank = 1;
                foreach (self::BALANCED_WEIGHTS as $criterionName => $weight) {
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

            // These tables are derived caches. Old rows use a different
            // methodology and must not be mixed with CQI v2 results.
            DB::table('player_smart_rank_history')->delete();
            DB::table('player_smart_results')->delete();
            DB::table('player_criteria_scores')->delete();
        });
    }

    public function down(): void
    {
        DB::transaction(function (): void {
            $provenId = DB::table('smart_criteria')->where('name', 'Proven Consistency')->value('id');
            if ($provenId !== null) {
                DB::table('smart_weight_values')->where('criteria_id', $provenId)->delete();
                DB::table('smart_criteria')->where('id', $provenId)->delete();
            }

            DB::table('smart_criteria')
                ->where('name', 'Consistency Percentile')
                ->update([
                    'name' => 'Consistency Index',
                    'description' => 'Higher consistency index is better',
                ]);

            DB::table('smart_criteria')
                ->where('name', 'CQI / Competition Exposure')
                ->update([
                    'name' => 'Competition Quality Index',
                    'description' => 'Higher CQI indicates matches played in higher difficulty regions',
                ]);

            $criteria = DB::table('smart_criteria')->pluck('id', 'name');
            $profileIds = DB::table('smart_weight_profiles')->where('name', 'Balanced Profile')->pluck('id');
            $legacy = [
                'Consistency Index' => 0.20,
                'Competition Quality Index' => 0.15,
                'Kill/Death Ratio (KD)' => 0.13,
                'KAST %' => 0.12,
                'First Death Rate' => 0.11,
                'Average Combat Score (ACS)' => 0.10,
                'Average Damage per Round (ADR)' => 0.10,
                'Meta Adaptability Index' => 0.09,
            ];

            foreach ($profileIds as $profileId) {
                $rank = 1;
                foreach ($legacy as $criterionName => $weight) {
                    DB::table('smart_weight_values')
                        ->where('profile_id', $profileId)
                        ->where('criteria_id', $criteria[$criterionName])
                        ->update([
                            'rank_position' => $rank++,
                            'computed_weight' => $weight,
                        ]);
                }
            }
        });
    }
};
