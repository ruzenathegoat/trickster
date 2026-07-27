<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Teams
        Schema::create('teams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('region')->nullable(); // NA, EMEA, APAC
            $table->text('logo_url')->nullable();
            $table->string('vlr_team_id')->unique();
        });

        // 2. Players
        Schema::create('players', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->nullable();
            $table->string('ign');
            $table->string('country')->nullable();
            $table->foreignUuid('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->string('current_role')->nullable();
            $table->string('vlr_player_id')->unique();
            $table->timestamp('created_at')->useCurrent();
        });

        // 3. Patches
        Schema::create('patches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('version')->unique();
            $table->date('release_date')->nullable();
            $table->text('patch_notes_url')->nullable();
        });

        // 4. Events
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('tier')->nullable();
            $table->string('region')->nullable();
            $table->string('season')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('vlr_event_id')->unique();
        });

        // 5. Stage Label Mapping
        Schema::create('stage_label_mapping', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('raw_label')->unique();
            $table->string('normalized_stage');
            $table->decimal('pressure_weight', 5, 2)->default(1.00);
        });

        // 6. Matches
        Schema::create('matches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignUuid('team_a_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignUuid('team_b_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignUuid('patch_id')->nullable()->constrained('patches')->nullOnDelete();
            $table->foreignUuid('stage_label_id')->nullable()->constrained('stage_label_mapping')->nullOnDelete();
            $table->date('match_date')->nullable();
            $table->smallInteger('best_of')->nullable();
            $table->string('raw_stage_label')->nullable();
            $table->string('vlr_match_id')->unique();
        });

        // 7. Maps
        Schema::create('maps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('match_id')->constrained('matches')->cascadeOnDelete();
            $table->string('map_name');
            $table->foreignUuid('winner_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->smallInteger('map_order')->nullable();
        });

        // 8. Player Map Stats
        Schema::create('player_map_stats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignUuid('map_id')->constrained('maps')->cascadeOnDelete();
            $table->string('role_at_time_of_match')->nullable();
            $table->string('agent_played')->nullable();
            $table->decimal('acs', 8, 2)->nullable();
            $table->decimal('kast', 5, 2)->nullable();
            $table->decimal('adr', 8, 2)->nullable();
            $table->decimal('kd', 5, 2)->nullable();
            $table->integer('first_kills')->default(0);
            $table->integer('first_deaths')->default(0);
            $table->integer('clutch_wins')->default(0);
            $table->decimal('rating', 5, 2)->nullable();
        });

        // 9. Agent Role Map
        Schema::create('agent_role_map', function (Blueprint $table) {
            $table->string('agent')->primary();
            $table->string('primary_role');
            $table->string('secondary_role')->nullable();
        });

        // 10. Agent Patch Ratings
        Schema::create('agent_patch_ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('patch_id')->constrained('patches')->cascadeOnDelete();
            $table->string('agent');
            $table->string('role')->nullable();
            $table->string('tier');
            $table->string('direction')->nullable();
            $table->text('notes')->nullable();
        });

        // 11. Agent Map Ratings
        Schema::create('agent_map_ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('patch_id')->constrained('patches')->cascadeOnDelete();
            $table->string('agent');
            $table->string('map');
            $table->decimal('score', 4, 2)->nullable();
            $table->date('effective_date')->nullable();
            $table->text('source_reference')->nullable();
            $table->string('confidence_level')->nullable();
            $table->uuid('superseded_by_id')->nullable();
        });

        Schema::table('agent_map_ratings', function (Blueprint $table) {
            $table->foreign('superseded_by_id')->references('id')->on('agent_map_ratings')->nullOnDelete();
        });

        // 12. Agent Pick Rate Snapshots
        Schema::create('agent_pick_rate_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('patch_id')->constrained('patches')->cascadeOnDelete();
            $table->string('agent');
            $table->string('map');
            $table->string('region')->nullable();
            $table->decimal('pick_rate', 5, 2)->nullable();
            $table->decimal('win_rate', 5, 2)->nullable();
            $table->date('snapshot_date')->nullable();
            $table->string('source')->nullable();
        });

        // 13. Smart Criteria
        Schema::create('smart_criteria', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('type');
            $table->text('description')->nullable();
        });

        // 14. Smart Weight Profiles
        Schema::create('smart_weight_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_public')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        // 15. Smart Weight Values
        Schema::create('smart_weight_values', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained('smart_weight_profiles')->cascadeOnDelete();
            $table->foreignUuid('criteria_id')->constrained('smart_criteria')->cascadeOnDelete();
            $table->smallInteger('rank_position')->nullable();
            $table->decimal('computed_weight', 5, 4)->nullable();
        });

        // 16. Smart Filter Criteria
        Schema::create('smart_filter_criteria', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('criteria_id')->constrained('smart_criteria')->cascadeOnDelete();
            $table->string('filter_type');
            $table->decimal('default_value', 10, 2)->nullable();
        });

        // 17. Search Query Filters
        Schema::create('search_query_filters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained('smart_weight_profiles')->cascadeOnDelete();
            $table->foreignUuid('criteria_id')->constrained('smart_criteria')->cascadeOnDelete();
            $table->string('operator');
            $table->decimal('value', 10, 2);
        });

        // 18. Player Criteria Scores
        Schema::create('player_criteria_scores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignUuid('criteria_id')->constrained('smart_criteria')->cascadeOnDelete();
            $table->foreignUuid('patch_id')->nullable()->constrained('patches')->cascadeOnDelete();
            $table->decimal('raw_value', 10, 4)->nullable();
            $table->decimal('global_normalized_utility', 10, 4)->nullable();
            $table->integer('sample_size')->nullable();
            $table->timestamp('calculated_at')->useCurrent();
        });

        // 19. Player Smart Results
        Schema::create('player_smart_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained('smart_weight_profiles')->cascadeOnDelete();
            $table->foreignUuid('patch_id')->nullable()->constrained('patches')->cascadeOnDelete();
            $table->string('mode');
            $table->decimal('final_score', 10, 4)->nullable();
            $table->integer('rank')->nullable();
            $table->timestamp('calculated_at')->useCurrent();
        });

        // 20. Scrape Jobs Log
        Schema::create('scrape_jobs_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source');
            $table->string('status');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->text('error_message')->nullable();
            $table->integer('records_processed')->default(0);
        });

        // 21. Scrape Alerts
        Schema::create('scrape_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_id')->constrained('scrape_jobs_log')->cascadeOnDelete();
            $table->string('alert_type')->nullable();
            $table->text('message')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scrape_alerts');
        Schema::dropIfExists('scrape_jobs_log');
        Schema::dropIfExists('player_smart_results');
        Schema::dropIfExists('player_criteria_scores');
        Schema::dropIfExists('search_query_filters');
        Schema::dropIfExists('smart_filter_criteria');
        Schema::dropIfExists('smart_weight_values');
        Schema::dropIfExists('smart_weight_profiles');
        Schema::dropIfExists('smart_criteria');
        Schema::dropIfExists('agent_pick_rate_snapshots');
        Schema::dropIfExists('agent_map_ratings');
        Schema::dropIfExists('agent_patch_ratings');
        Schema::dropIfExists('agent_role_map');
        Schema::dropIfExists('player_map_stats');
        Schema::dropIfExists('maps');
        Schema::dropIfExists('matches');
        Schema::dropIfExists('stage_label_mapping');
        Schema::dropIfExists('events');
        Schema::dropIfExists('patches');
        Schema::dropIfExists('players');
        Schema::dropIfExists('teams');
    }
};
