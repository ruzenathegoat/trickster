<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->foreignUuid('team_id_at_match')->nullable()->after('player_id')->constrained('teams')->nullOnDelete();
            $table->string('role_at_match')->nullable()->after('team_id_at_match');
            $table->string('team_context_source')->nullable()->after('role_at_match');
            $table->string('role_context_source')->nullable()->after('team_context_source');
            $table->index(['match_id', 'team_id_at_match'], 'pms_match_team_context_idx');
            $table->index(['player_id', 'role_at_match'], 'pms_player_role_context_idx');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->string('competition_level')->nullable()->after('tier');
            $table->decimal('competition_base_weight', 6, 3)->nullable()->after('competition_level');
        });

        Schema::table('player_criteria_scores', function (Blueprint $table) {
            $table->string('method_version')->nullable()->after('sample_size');
        });

        Schema::table('player_smart_results', function (Blueprint $table) {
            $table->string('method_version')->nullable()->after('smart_confidence');
        });

        Schema::create('team_rating_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('match_id')->constrained('matches')->cascadeOnDelete();
            $table->foreignUuid('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignUuid('opponent_id')->constrained('teams')->cascadeOnDelete();
            $table->unsignedSmallInteger('season');
            $table->decimal('rating_before', 10, 4);
            $table->decimal('rating_after', 10, 4);
            $table->decimal('rating_percentile', 7, 4);
            $table->decimal('rating_confidence', 7, 4);
            $table->string('method_version');
            $table->timestamp('calculated_at');
            $table->unique(['match_id', 'team_id'], 'team_rating_match_team_unique');
            $table->index(['season', 'team_id'], 'team_rating_season_team_idx');
        });

        Schema::create('match_team_quality_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('match_id')->constrained('matches')->cascadeOnDelete();
            $table->foreignUuid('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignUuid('opponent_id')->constrained('teams')->cascadeOnDelete();
            $table->unsignedSmallInteger('season');
            $table->string('competition_level');
            $table->decimal('event_base', 8, 4);
            $table->decimal('stage_factor', 8, 4);
            $table->decimal('opponent_factor', 8, 4);
            $table->decimal('match_quality', 10, 4);
            $table->string('method_version');
            $table->timestamp('calculated_at');
            $table->unique(['match_id', 'team_id'], 'match_quality_match_team_unique');
            $table->index(['season', 'team_id'], 'match_quality_season_team_idx');
            $table->index(['team_id', 'match_quality'], 'match_quality_team_score_idx');
        });

        Schema::create('player_match_quality_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignUuid('match_id')->constrained('matches')->cascadeOnDelete();
            $table->foreignUuid('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignUuid('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignUuid('opponent_id')->constrained('teams')->cascadeOnDelete();
            $table->unsignedSmallInteger('season');
            $table->string('role');
            $table->string('competition_level');
            $table->decimal('acs_percentile', 7, 3);
            $table->decimal('adr_percentile', 7, 3);
            $table->decimal('kast_percentile', 7, 3);
            $table->decimal('kd_percentile', 7, 3);
            $table->decimal('performance_utility', 7, 3);
            $table->decimal('match_quality', 10, 4);
            $table->decimal('weighted_contribution', 12, 4);
            $table->string('method_version');
            $table->timestamp('calculated_at');
            $table->unique(['player_id', 'match_id'], 'player_match_quality_unique');
            $table->index(['season', 'player_id'], 'player_quality_season_player_idx');
        });

        Schema::create('player_competition_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->unsignedSmallInteger('season');
            $table->decimal('performance_dispersion', 10, 4)->nullable();
            $table->decimal('consistency_percentile', 7, 3)->nullable();
            $table->decimal('cqi_raw', 10, 4)->nullable();
            $table->decimal('cqi_adjusted', 10, 4)->nullable();
            $table->decimal('cqi_percentile', 7, 3)->nullable();
            $table->decimal('weighted_performance', 7, 3)->nullable();
            $table->decimal('proven_consistency', 7, 3)->nullable();
            $table->unsignedInteger('total_matches')->default(0);
            $table->unsignedSmallInteger('event_count')->default(0);
            $table->unsignedSmallInteger('international_matches')->default(0);
            $table->unsignedSmallInteger('international_events')->default(0);
            $table->decimal('confidence', 7, 4)->default(0);
            $table->string('validation_status')->default('limited_evidence');
            $table->string('method_version');
            $table->timestamp('calculated_at');
            $table->unique(['player_id', 'season'], 'player_competition_season_unique');
            $table->index(['season', 'proven_consistency'], 'player_competition_proven_idx');
            $table->index(['season', 'validation_status'], 'player_competition_validation_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_competition_metrics');
        Schema::dropIfExists('player_match_quality_metrics');
        Schema::dropIfExists('match_team_quality_scores');
        Schema::dropIfExists('team_rating_snapshots');

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['competition_level', 'competition_base_weight']);
        });

        Schema::table('player_criteria_scores', function (Blueprint $table) {
            $table->dropColumn('method_version');
        });

        Schema::table('player_smart_results', function (Blueprint $table) {
            $table->dropColumn('method_version');
        });

        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->dropForeign(['team_id_at_match']);
            $table->dropIndex('pms_match_team_context_idx');
            $table->dropIndex('pms_player_role_context_idx');
            $table->dropColumn([
                'team_id_at_match',
                'role_at_match',
                'team_context_source',
                'role_context_source',
            ]);
        });
    }
};
