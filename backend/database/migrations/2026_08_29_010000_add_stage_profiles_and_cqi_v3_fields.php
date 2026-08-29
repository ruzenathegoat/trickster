<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_format_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('display_name');
            $table->string('competition_level');
            $table->unsignedSmallInteger('valid_from_season')->default(2026);
            $table->unsignedSmallInteger('valid_to_season')->nullable();
            $table->decimal('evidence_cap', 6, 3)->default(4.000);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['competition_level', 'is_active']);
        });

        Schema::table('stage_label_mapping', function (Blueprint $table) {
            $table->dropUnique(['raw_label']);
            $table->renameColumn('pressure_weight', 'quality_weight');
        });

        Schema::table('stage_label_mapping', function (Blueprint $table) {
            $table->foreignId('stage_format_profile_id')
                ->nullable()
                ->after('id')
                ->constrained('stage_format_profiles')
                ->nullOnDelete();
            $table->string('label_operator')->default('exact')->after('raw_label');
            $table->string('canonical_label')->nullable()->after('label_operator');
            $table->string('phase')->nullable()->after('normalized_stage');
            $table->string('bracket')->nullable()->after('phase');
            $table->unsignedSmallInteger('round_number')->nullable()->after('bracket');
            $table->boolean('is_elimination_match')->default(false)->after('round_number');
            $table->boolean('is_qualification_match')->default(false)->after('is_elimination_match');
            $table->decimal('consistency_evidence_weight', 6, 3)->default(0.000)->after('quality_weight');
            $table->integer('priority')->default(100)->after('consistency_evidence_weight');
            $table->string('source')->default('curated')->after('priority');
            $table->boolean('is_active')->default(true)->after('source');
            $table->nullableTimestamps();
            $table->unique(
                ['stage_format_profile_id', 'label_operator', 'raw_label'],
                'stage_mapping_profile_operator_label_unique'
            );
            $table->index(
                ['stage_format_profile_id', 'is_active', 'priority'],
                'stage_mapping_profile_active_priority_idx'
            );
        });

        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('stage_format_profile_id')
                ->nullable()
                ->after('competition_base_weight')
                ->constrained('stage_format_profiles')
                ->nullOnDelete();
            $table->string('stage_profile_source')->nullable()->after('stage_format_profile_id');
            $table->timestamp('stage_profile_resolved_at')->nullable()->after('stage_profile_source');
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->string('stage_resolution_source')->nullable()->after('raw_stage_label');
            $table->timestamp('stage_resolved_at')->nullable()->after('stage_resolution_source');
        });

        Schema::table('match_team_quality_scores', function (Blueprint $table) {
            $table->foreignId('stage_mapping_id')
                ->nullable()
                ->after('competition_level')
                ->constrained('stage_label_mapping')
                ->nullOnDelete();
            $table->string('stage_format_profile')->nullable()->after('stage_mapping_id');
            $table->string('normalized_stage')->nullable()->after('stage_format_profile');
            $table->decimal('stage_evidence_weight', 6, 3)->default(0.000)->after('stage_factor');
            $table->string('stage_resolution_source')->default('unmapped')->after('stage_evidence_weight');
        });

        Schema::table('player_match_quality_metrics', function (Blueprint $table) {
            $table->foreignId('stage_mapping_id')
                ->nullable()
                ->after('competition_level')
                ->constrained('stage_label_mapping')
                ->nullOnDelete();
            $table->string('stage_format_profile')->nullable()->after('stage_mapping_id');
            $table->string('normalized_stage')->nullable()->after('stage_format_profile');
            $table->decimal('stage_factor', 8, 4)->default(1.0000)->after('normalized_stage');
            $table->decimal('stage_evidence_weight', 6, 3)->default(0.000)->after('stage_factor');
            $table->string('stage_resolution_source')->default('unmapped')->after('stage_evidence_weight');
        });

        Schema::table('player_competition_metrics', function (Blueprint $table) {
            $table->decimal('stage_evidence', 10, 4)->default(0.0000)->after('weighted_performance');
            $table->decimal('stage_confidence', 7, 4)->default(0.0000)->after('stage_evidence');
            $table->unsignedInteger('high_pressure_matches')->default(0)->after('stage_confidence');
            $table->decimal('base_proven_consistency', 7, 3)->nullable()->after('high_pressure_matches');
            $table->json('stage_exposure_breakdown')->nullable()->after('base_proven_consistency');
        });

        Schema::create('metric_calculation_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedSmallInteger('season');
            $table->string('status')->default('queued');
            $table->string('method_version')->nullable();
            $table->json('summary')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['season', 'status']);
        });

        $this->seedProfilesAndMappings();
    }

    public function down(): void
    {
        Schema::dropIfExists('metric_calculation_runs');

        Schema::table('player_competition_metrics', function (Blueprint $table) {
            $table->dropColumn([
                'stage_evidence',
                'stage_confidence',
                'high_pressure_matches',
                'base_proven_consistency',
                'stage_exposure_breakdown',
            ]);
        });

        Schema::table('player_match_quality_metrics', function (Blueprint $table) {
            $table->dropConstrainedForeignId('stage_mapping_id');
            $table->dropColumn([
                'stage_format_profile',
                'normalized_stage',
                'stage_factor',
                'stage_evidence_weight',
                'stage_resolution_source',
            ]);
        });

        Schema::table('match_team_quality_scores', function (Blueprint $table) {
            $table->dropConstrainedForeignId('stage_mapping_id');
            $table->dropColumn([
                'stage_format_profile',
                'normalized_stage',
                'stage_evidence_weight',
                'stage_resolution_source',
            ]);
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->dropColumn(['stage_resolution_source', 'stage_resolved_at']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('stage_format_profile_id');
            $table->dropColumn(['stage_profile_source', 'stage_profile_resolved_at']);
        });

        Schema::table('stage_label_mapping', function (Blueprint $table) {
            $table->dropUnique('stage_mapping_profile_operator_label_unique');
            $table->dropIndex('stage_mapping_profile_active_priority_idx');
            $table->dropConstrainedForeignId('stage_format_profile_id');
            $table->dropColumn([
                'label_operator',
                'canonical_label',
                'phase',
                'bracket',
                'round_number',
                'is_elimination_match',
                'is_qualification_match',
                'consistency_evidence_weight',
                'priority',
                'source',
                'is_active',
                'created_at',
                'updated_at',
            ]);
            $table->renameColumn('quality_weight', 'pressure_weight');
            $table->unique('raw_label');
        });

        Schema::dropIfExists('stage_format_profiles');
    }

    private function seedProfilesAndMappings(): void
    {
        $now = now();
        $profiles = [
            'vct_kickoff_triple_elim_2026' => [1, 'VCT Kickoff — Triple Elimination', 'kickoff', 4.000],
            'vct_regional_groups_playins_playoffs_2026' => [2, 'VCT Regional — Groups, Play-Ins & Playoffs', 'regional_league', 4.000],
            'vct_masters_swiss_playoffs_2026' => [3, 'VCT Masters — Swiss & Playoffs', 'masters', 5.000],
            'vct_champions_groups_playoffs_2026' => [4, 'VCT Champions — Groups & Playoffs', 'champions', 6.000],
        ];

        $profileIds = [];
        foreach ($profiles as $key => [$id, $name, $level, $cap]) {
            $profileIds[$key] = $id;
            DB::table('stage_format_profiles')->insert([
                'id' => $id,
                'key' => $key,
                'display_name' => $name,
                'competition_level' => $level,
                'valid_from_season' => 2026,
                'valid_to_season' => null,
                'evidence_cap' => $cap,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "SELECT setval(pg_get_serial_sequence('stage_format_profiles', 'id'), ".
                'COALESCE((SELECT MAX(id) FROM stage_format_profiles), 1), true)'
            );
        }

        $rows = [];
        $add = function (
            string $profile,
            string $operator,
            string $label,
            string $stage,
            float $quality,
            float $evidence,
            ?string $phase = null,
            ?string $bracket = null,
            ?int $round = null,
            bool $elimination = false,
            bool $qualification = false,
            int $priority = 100
        ) use (&$rows, $profileIds, $now): void {
            $rows[] = [
                'stage_format_profile_id' => $profileIds[$profile],
                'raw_label' => $label,
                'label_operator' => $operator,
                'canonical_label' => $operator === 'exact' ? $this->canonicalize($label) : null,
                'normalized_stage' => $stage,
                'phase' => $phase,
                'bracket' => $bracket,
                'round_number' => $round,
                'is_elimination_match' => $elimination,
                'is_qualification_match' => $qualification,
                'quality_weight' => $quality,
                'consistency_evidence_weight' => $evidence,
                'priority' => $priority,
                'source' => 'seeded',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        };

        $kickoff = 'vct_kickoff_triple_elim_2026';
        $kickoffRounds = [
            ['Upper', 1, 1.00, 0.10], ['Upper', 2, 1.01, 0.20], ['Upper', 3, 1.03, 0.50],
            ['Middle', 1, 1.02, 0.40], ['Middle', 2, 1.03, 0.60], ['Middle', 3, 1.04, 0.80], ['Middle', 4, 1.05, 1.00],
            ['Lower', 1, 1.04, 0.80], ['Lower', 2, 1.05, 1.00], ['Lower', 3, 1.06, 1.20], ['Lower', 4, 1.07, 1.40], ['Lower', 5, 1.08, 1.60],
        ];
        foreach ($kickoffRounds as [$bracket, $round, $quality, $evidence]) {
            $lowerBracket = strtolower($bracket);
            $add(
                $kickoff,
                'exact',
                "Main Event: {$bracket} Round {$round}",
                "{$lowerBracket}_round",
                $quality,
                $evidence,
                'main_event',
                $lowerBracket,
                $round,
                $lowerBracket === 'lower',
                false,
                1000
            );
        }
        foreach ([
            ['Upper', 1.08, 2.00],
            ['Middle', 1.09, 2.25],
            ['Lower', 1.10, 2.50],
        ] as [$bracket, $quality, $evidence]) {
            $lowerBracket = strtolower($bracket);
            $add(
                $kickoff,
                'exact',
                "Main Event: {$bracket} Final",
                "{$lowerBracket}_qualifier_final",
                $quality,
                $evidence,
                'main_event',
                $lowerBracket,
                null,
                $lowerBracket === 'lower',
                true,
                1100
            );
        }
        $add($kickoff, 'default', '*', 'kickoff_unclassified', 1.00, 0.00, 'main_event', null, null, false, false, 0);

        $regional = 'vct_regional_groups_playins_playoffs_2026';
        foreach ([
            ['regex', '^Group Stage:', 'group_stage', 1.00, 0.00, 'group', null, false, false, 500],
            ['regex', '^Play-Ins: Upper (Round|Quarterfinal)', 'play_in_upper', 1.01, 0.15, 'play_in', 'upper', false, false, 600],
            ['regex', '^Play-Ins: Upper Semifinal', 'play_in_upper_semifinal', 1.02, 0.35, 'play_in', 'upper', false, false, 650],
            ['regex', '^Play-Ins: Upper Final$', 'play_in_upper_final', 1.05, 1.00, 'play_in', 'upper', false, true, 700],
            ['regex', '^Play-Ins: Lower Round', 'play_in_lower', 1.03, 0.60, 'play_in', 'lower', true, false, 600],
            ['regex', '^Play-Ins: Lower Final$', 'play_in_lower_final', 1.05, 1.00, 'play_in', 'lower', true, true, 700],
            ['regex', '^Playoffs: Upper (Round|Quarterfinal)', 'playoffs_upper', 1.03, 0.50, 'playoffs', 'upper', false, false, 600],
            ['regex', '^Playoffs: Upper Semifinal', 'playoffs_upper_semifinal', 1.04, 0.75, 'playoffs', 'upper', false, false, 650],
            ['regex', '^Playoffs: Upper Final$', 'playoffs_upper_final', 1.05, 1.00, 'playoffs', 'upper', false, false, 700],
            ['regex', '^Playoffs: Lower Round', 'playoffs_lower', 1.05, 1.00, 'playoffs', 'lower', true, false, 600],
            ['regex', '^Playoffs: Lower Final$', 'playoffs_lower_final', 1.07, 1.50, 'playoffs', 'lower', true, false, 700],
            ['regex', '^Playoffs: Grand Final$', 'grand_final', 1.08, 2.00, 'playoffs', null, false, true, 800],
        ] as [$operator, $label, $stage, $quality, $evidence, $phase, $bracket, $elimination, $qualification, $priority]) {
            $add($regional, $operator, $label, $stage, $quality, $evidence, $phase, $bracket, null, $elimination, $qualification, $priority);
        }
        $add($regional, 'default', '*', 'regional_unclassified', 1.00, 0.00, null, null, null, false, false, 0);

        $masters = 'vct_masters_swiss_playoffs_2026';
        foreach ([
            ['regex', '^Swiss Stage: Round 1', 'swiss_round_1', 1.00, 0.25, 'swiss', null, false, false, 600],
            ['regex', '^Swiss Stage: Round 2 \(1-0\)', 'swiss_round_2_advancement', 1.01, 0.35, 'swiss', null, false, false, 650],
            ['regex', '^Swiss Stage: Round 2 \(0-1\)', 'swiss_round_2_elimination', 1.02, 0.50, 'swiss', null, true, false, 650],
            ['regex', '^Swiss Stage: Round 3', 'swiss_decider', 1.04, 1.00, 'swiss', null, true, false, 700],
            ['regex', '^Playoffs: Upper Quarterfinal', 'playoffs_upper_quarterfinal', 1.05, 1.00, 'playoffs', 'upper', false, false, 600],
            ['regex', '^Playoffs: Upper Semifinal', 'playoffs_upper_semifinal', 1.06, 1.25, 'playoffs', 'upper', false, false, 650],
            ['regex', '^Playoffs: Upper Final$', 'playoffs_upper_final', 1.08, 1.75, 'playoffs', 'upper', false, false, 700],
            ['regex', '^Playoffs: Lower Round 1$', 'playoffs_lower_round_1', 1.06, 1.25, 'playoffs', 'lower', true, false, 650],
            ['regex', '^Playoffs: Lower Round 2$', 'playoffs_lower_round_2', 1.08, 1.50, 'playoffs', 'lower', true, false, 650],
            ['regex', '^Playoffs: Lower Round 3$', 'playoffs_lower_round_3', 1.09, 1.75, 'playoffs', 'lower', true, false, 650],
            ['regex', '^Playoffs: Lower Final$', 'playoffs_lower_final', 1.11, 2.25, 'playoffs', 'lower', true, false, 700],
            ['regex', '^Playoffs: Grand Final$', 'grand_final', 1.14, 2.75, 'playoffs', null, false, true, 800],
        ] as [$operator, $label, $stage, $quality, $evidence, $phase, $bracket, $elimination, $qualification, $priority]) {
            $add($masters, $operator, $label, $stage, $quality, $evidence, $phase, $bracket, null, $elimination, $qualification, $priority);
        }
        $add($masters, 'default', '*', 'masters_unclassified', 1.00, 0.25, null, null, null, false, false, 0);

        $champions = 'vct_champions_groups_playoffs_2026';
        foreach ([
            ['regex', '^Group Stage:.*(Elimination|Elim)', 'group_elimination', 1.05, 1.25, 'group', null, true, false, 750],
            ['regex', '^Group Stage:.*(Decider|Qualification)', 'group_decider', 1.06, 1.50, 'group', null, true, true, 750],
            ['regex', '^Group Stage:', 'group_stage', 1.00, 0.50, 'group', null, false, false, 500],
            ['regex', '^Playoffs: Upper Quarterfinal', 'playoffs_upper_quarterfinal', 1.07, 1.50, 'playoffs', 'upper', false, false, 600],
            ['regex', '^Playoffs: Upper Semifinal', 'playoffs_upper_semifinal', 1.09, 1.75, 'playoffs', 'upper', false, false, 650],
            ['regex', '^Playoffs: Upper Final$', 'playoffs_upper_final', 1.10, 2.00, 'playoffs', 'upper', false, false, 700],
            ['regex', '^Playoffs: Lower Round', 'playoffs_lower', 1.10, 2.00, 'playoffs', 'lower', true, false, 650],
            ['regex', '^Playoffs: Lower Final$', 'playoffs_lower_final', 1.12, 2.50, 'playoffs', 'lower', true, false, 700],
            ['regex', '^Playoffs: Grand Final$', 'grand_final', 1.15, 3.00, 'playoffs', null, false, true, 800],
        ] as [$operator, $label, $stage, $quality, $evidence, $phase, $bracket, $elimination, $qualification, $priority]) {
            $add($champions, $operator, $label, $stage, $quality, $evidence, $phase, $bracket, null, $elimination, $qualification, $priority);
        }
        $add($champions, 'default', '*', 'champions_unclassified', 1.00, 0.50, null, null, null, false, false, 0);

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('stage_label_mapping')->insert($chunk);
        }
    }

    private function canonicalize(string $label): string
    {
        return Str::of($label)->lower()->squish()->value();
    }
};
