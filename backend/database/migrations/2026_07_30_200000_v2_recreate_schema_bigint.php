<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * V2 Schema: Hybrid UUID/bigint strategy.
 *
 * UUID kept on public-facing tables: users, teams, players, events, matches, smart_weight_profiles
 * Everything else uses auto-increment bigint for performance.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Drop everything in FK-safe order ──
        $tables = [
            'scrape_alerts', 'scrape_jobs_log',
            'player_smart_results', 'player_criteria_scores',
            'search_query_filters', 'smart_filter_criteria', 'smart_weight_values', 'smart_weight_profiles', 'smart_criteria',
            'agent_pick_rate_snapshots', 'agent_map_ratings', 'agent_patch_ratings',
            'player_match_agents', 'player_map_stats',
            'patch_map_pools', 'valorant_maps', 'valorant_agents',
            'maps', 'matches', 'stage_label_mapping', 'events',
            'patches', 'players', 'teams',
            'personal_access_tokens', 'sessions', 'cache_locks', 'cache',
            'failed_jobs', 'job_batches', 'jobs',
            'password_reset_tokens', 'users',
            'match_scrape_queues',
            'agent_role_map',
        ];

        foreach ($tables as $t) {
            Schema::dropIfExists($t);
        }

        // ══════════════════════════════════════════════
        // USERS (UUID — auth/security)
        // ══════════════════════════════════════════════
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('user');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // ── Cache ──
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });
        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // ── Jobs ──
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });
        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });
        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        // ── Personal Access Tokens (Sanctum) ──
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuidMorphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════
        // DOMAIN TABLES
        // ══════════════════════════════════════════════

        // 1. Teams (UUID — public-facing)
        Schema::create('teams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('region')->nullable();
            $table->text('logo_url')->nullable();
            $table->string('vlr_team_id')->unique();
            $table->decimal('win_rate_2026', 5, 2)->nullable();
        });

        // 2. Players (UUID — public-facing)
        Schema::create('players', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->nullable();
            $table->string('ign');
            $table->string('country')->nullable();
            $table->foreignUuid('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->string('current_role')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('vlr_player_id')->unique();
            // Aggregate stats
            $table->integer('total_matches')->default(0);
            $table->integer('total_wins')->default(0);
            $table->decimal('win_rate', 5, 2)->default(0);
            $table->decimal('avg_acs', 6, 1)->default(0);
            $table->decimal('avg_kd', 5, 2)->default(0);
            $table->decimal('avg_kast', 5, 1)->default(0);
            $table->decimal('avg_adr', 6, 1)->default(0);
            $table->decimal('avg_rating', 4, 2)->default(0);
            $table->integer('total_kills')->default(0);
            $table->integer('total_deaths')->default(0);
            $table->integer('total_assists')->default(0);
            $table->decimal('consistency_index', 5, 2)->nullable();
            $table->float('avg_fk')->nullable();
            $table->float('avg_fd')->nullable();
            $table->float('meta_alignment_score')->default(0);
            $table->float('flexibility_score')->default(0);
            $table->float('meta_adaptability_index')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        // 3. Patches (bigint — internal lookup)
        Schema::create('patches', function (Blueprint $table) {
            $table->id();
            $table->string('version')->unique();
            $table->date('release_date')->nullable();
            $table->text('patch_notes_url')->nullable();
        });

        // 4. Events (UUID — admin URLs)
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

        // 5. Stage Label Mapping (bigint — small lookup)
        Schema::create('stage_label_mapping', function (Blueprint $table) {
            $table->id();
            $table->string('raw_label')->unique();
            $table->string('normalized_stage');
            $table->decimal('pressure_weight', 5, 2)->default(1.00);
        });

        // 6. Matches (UUID — public-facing)
        Schema::create('matches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignUuid('team_a_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignUuid('team_b_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignUuid('winner_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->foreignId('patch_id')->nullable()->constrained('patches')->nullOnDelete();
            $table->foreignId('stage_label_id')->nullable()->constrained('stage_label_mapping')->nullOnDelete();
            $table->date('match_date')->nullable();
            $table->smallInteger('best_of')->nullable();
            $table->string('raw_stage_label')->nullable();
            $table->string('vlr_match_id')->unique();
        });

        // 7. Maps (bigint — child of match, internal)
        Schema::create('maps', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('match_id')->constrained('matches')->cascadeOnDelete();
            $table->string('map_name');
            $table->string('valorant_map_name')->nullable();
            $table->foreignUuid('winner_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->smallInteger('map_order')->nullable();
        });

        // 8. Player Map Stats (bigint — highest volume, biggest perf gain)
        Schema::create('player_map_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignId('map_id')->constrained('maps')->cascadeOnDelete();
            $table->foreignUuid('match_id')->nullable()->constrained('matches')->nullOnDelete();
            $table->string('agent_played')->nullable();
            $table->decimal('acs', 8, 2)->nullable();
            $table->decimal('kast', 5, 2)->nullable();
            $table->decimal('adr', 8, 2)->nullable();
            $table->decimal('kd', 5, 2)->nullable();
            $table->decimal('rating', 5, 2)->nullable();
            $table->integer('kills')->default(0);
            $table->integer('deaths')->default(0);
            $table->integer('assists')->default(0);
            $table->integer('fk')->nullable();
            $table->integer('fd')->nullable();
        });

        // 9. Agent Role Map (string PK — unchanged)
        Schema::create('agent_role_map', function (Blueprint $table) {
            $table->string('agent')->primary();
            $table->string('primary_role');
            $table->string('secondary_role')->nullable();
        });

        // 10. Agent Patch Ratings (bigint — internal curation)
        Schema::create('agent_patch_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patch_id')->constrained('patches')->cascadeOnDelete();
            $table->string('agent');
            $table->string('role')->nullable();
            $table->string('tier');
            $table->string('direction')->nullable();
            $table->text('notes')->nullable();
        });

        // 11. Agent Map Ratings (bigint — internal curation)
        Schema::create('agent_map_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patch_id')->constrained('patches')->cascadeOnDelete();
            $table->string('agent');
            $table->string('map');
            $table->decimal('score', 4, 2)->nullable();
            $table->date('effective_date')->nullable();
            $table->text('source_reference')->nullable();
            $table->string('confidence_level')->nullable();
            $table->unsignedBigInteger('superseded_by_id')->nullable();
        });
        Schema::table('agent_map_ratings', function (Blueprint $table) {
            $table->foreign('superseded_by_id')->references('id')->on('agent_map_ratings')->nullOnDelete();
        });

        // 12. Agent Pick Rate Snapshots (bigint — internal analytics)
        Schema::create('agent_pick_rate_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('map_id')->nullable()->constrained('maps')->cascadeOnDelete();
            $table->string('valorant_map_name')->nullable();
            $table->string('agent_name');
            $table->float('pick_rate', 5, 2);
            $table->integer('total_picks');
            $table->integer('total_matches');
            $table->timestamps();
            $table->index(['event_id', 'map_id', 'agent_name']);
        });

        // 13. Smart Criteria (bigint — small config)
        Schema::create('smart_criteria', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('type');
            $table->text('description')->nullable();
        });

        // 14. Smart Weight Profiles (UUID — shareable)
        Schema::create('smart_weight_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_public')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        // 15. Smart Weight Values (bigint — internal pivot)
        Schema::create('smart_weight_values', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('profile_id')->constrained('smart_weight_profiles')->cascadeOnDelete();
            $table->foreignId('criteria_id')->constrained('smart_criteria')->cascadeOnDelete();
            $table->smallInteger('rank_position')->nullable();
            $table->decimal('computed_weight', 5, 4)->nullable();
        });

        // 16. Smart Filter Criteria (bigint — internal config)
        Schema::create('smart_filter_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('criteria_id')->constrained('smart_criteria')->cascadeOnDelete();
            $table->string('filter_type');
            $table->decimal('default_value', 10, 2)->nullable();
        });

        // 17. Search Query Filters (bigint — internal)
        Schema::create('search_query_filters', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('profile_id')->constrained('smart_weight_profiles')->cascadeOnDelete();
            $table->foreignId('criteria_id')->constrained('smart_criteria')->cascadeOnDelete();
            $table->string('operator');
            $table->decimal('value', 10, 2);
        });

        // 18. Player Criteria Scores (bigint — internal computation)
        Schema::create('player_criteria_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignId('criteria_id')->constrained('smart_criteria')->cascadeOnDelete();
            $table->foreignId('patch_id')->nullable()->constrained('patches')->cascadeOnDelete();
            $table->decimal('raw_value', 10, 4)->nullable();
            $table->decimal('global_normalized_utility', 10, 4)->nullable();
            $table->integer('sample_size')->nullable();
            $table->timestamp('calculated_at')->useCurrent();
        });

        // 19. Player Smart Results (bigint — internal computation)
        Schema::create('player_smart_results', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained('smart_weight_profiles')->cascadeOnDelete();
            $table->foreignId('patch_id')->nullable()->constrained('patches')->cascadeOnDelete();
            $table->string('mode');
            $table->decimal('final_score', 10, 4)->nullable();
            $table->integer('rank')->nullable();
            $table->timestamp('calculated_at')->useCurrent();
        });

        // 20. Scrape Jobs Log (bigint — internal logging)
        Schema::create('scrape_jobs_log', function (Blueprint $table) {
            $table->id();
            $table->string('source');
            $table->string('status');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->text('error_message')->nullable();
            $table->integer('records_processed')->default(0);
        });

        // 21. Scrape Alerts (bigint — internal logging)
        Schema::create('scrape_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('scrape_jobs_log')->cascadeOnDelete();
            $table->string('alert_type')->nullable();
            $table->text('message')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        // 22. Match Scrape Queues (bigint — already was)
        Schema::create('match_scrape_queues', function (Blueprint $table) {
            $table->id();
            $table->string('vlr_event_id')->nullable();
            $table->string('vlr_match_id')->unique();
            $table->string('url');
            $table->string('status')->default('pending');
            $table->integer('attempts')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamps();
        });

        // 23. Player Match Agents (bigint — internal pivot)
        Schema::create('player_match_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignUuid('match_id')->constrained('matches')->cascadeOnDelete();
            $table->foreignId('map_id')->constrained('maps')->cascadeOnDelete();
            $table->string('agent_name');
            $table->timestamps();
            $table->unique(['player_id', 'match_id', 'map_id', 'agent_name'], 'player_map_agent_unique');
        });

        // 24. Valorant Maps (bigint — small lookup)
        Schema::create('valorant_maps', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 25. Patch Map Pools (bigint — internal pivot)
        Schema::create('patch_map_pools', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patch_id')->constrained('patches')->cascadeOnDelete();
            $table->string('map_name');
            $table->unique(['patch_id', 'map_name']);
        });

        // 26. Valorant Agents (bigint — new, for agent photos from valorant-api.com)
        Schema::create('valorant_agents', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('role');
            $table->text('icon_url')->nullable();
            $table->text('portrait_url')->nullable();
            $table->string('api_uuid')->unique();
            $table->timestamps();
        });

        // ── Seed Valorant Maps ──
        $maps = ['Abyss', 'Ascent', 'Bind', 'Breeze', 'Corrode', 'Fracture', 'Haven', 'Icebox', 'Lotus', 'Pearl', 'Split', 'Summit', 'Sunset'];
        foreach ($maps as $map) {
            DB::table('valorant_maps')->insert(['name' => $map, 'created_at' => now(), 'updated_at' => now()]);
        }

        // ── Enable Row Level Security (RLS) for all tables ──
        if (DB::connection()->getDriverName() === 'pgsql') {
            $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
            foreach ($tables as $t) {
                if ($t->tablename !== 'migrations') {
                    DB::statement("ALTER TABLE \"{$t->tablename}\" ENABLE ROW LEVEL SECURITY;");
                }
            }
        }
    }

    public function down(): void
    {
        // Just drop everything — this is a full schema recreation
        $tables = [
            'valorant_agents', 'patch_map_pools', 'valorant_maps',
            'player_match_agents', 'match_scrape_queues',
            'scrape_alerts', 'scrape_jobs_log',
            'player_smart_results', 'player_criteria_scores',
            'search_query_filters', 'smart_filter_criteria', 'smart_weight_values', 'smart_weight_profiles', 'smart_criteria',
            'agent_pick_rate_snapshots', 'agent_map_ratings', 'agent_patch_ratings',
            'player_map_stats', 'maps', 'matches',
            'stage_label_mapping', 'events', 'patches', 'players', 'teams',
            'personal_access_tokens', 'sessions', 'cache_locks', 'cache',
            'failed_jobs', 'job_batches', 'jobs',
            'password_reset_tokens', 'users',
            'agent_role_map',
        ];
        foreach ($tables as $t) {
            Schema::dropIfExists($t);
        }
    }
};
