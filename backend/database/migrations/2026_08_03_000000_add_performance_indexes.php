<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance indexes.
 *
 * The v2 schema created foreign keys with ->constrained(), which on Postgres
 * does NOT create an index on the referencing column. These indexes cover the
 * FK/join/sort/filter columns used by the hot API endpoints (dashboard, meta,
 * leaderboard, scout, simulation) so cache-miss queries stop doing full scans.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_smart_results', function (Blueprint $table) {
            // dashboard top-player + leaderboard: filter by mode, order by final_score
            $table->index(['mode', 'final_score'], 'psr_mode_score_idx');
            // joins from players
            $table->index('player_id', 'psr_player_idx');
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->index('winner_team_id', 'matches_winner_idx');
            $table->index('match_date', 'matches_date_idx');
            $table->index('team_a_id', 'matches_team_a_idx');
            $table->index('team_b_id', 'matches_team_b_idx');
        });

        Schema::table('patches', function (Blueprint $table) {
            // dashboard / active-patch / meta all orderBy release_date desc
            $table->index('release_date', 'patches_release_idx');
        });

        Schema::table('agent_patch_ratings', function (Blueprint $table) {
            $table->index('patch_id', 'apr_patch_idx');
        });

        Schema::table('agent_map_ratings', function (Blueprint $table) {
            $table->index('patch_id', 'amr_patch_idx');
            $table->index('superseded_by_id', 'amr_superseded_idx');
        });

        Schema::table('players', function (Blueprint $table) {
            $table->index('team_id', 'players_team_idx');
            $table->index('current_role', 'players_role_idx');
            $table->index('avg_rating', 'players_rating_idx');
        });
    }

    public function down(): void
    {
        Schema::table('player_smart_results', function (Blueprint $table) {
            $table->dropIndex('psr_mode_score_idx');
            $table->dropIndex('psr_player_idx');
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->dropIndex('matches_winner_idx');
            $table->dropIndex('matches_date_idx');
            $table->dropIndex('matches_team_a_idx');
            $table->dropIndex('matches_team_b_idx');
        });

        Schema::table('patches', function (Blueprint $table) {
            $table->dropIndex('patches_release_idx');
        });

        Schema::table('agent_patch_ratings', function (Blueprint $table) {
            $table->dropIndex('apr_patch_idx');
        });

        Schema::table('agent_map_ratings', function (Blueprint $table) {
            $table->dropIndex('amr_patch_idx');
            $table->dropIndex('amr_superseded_idx');
        });

        Schema::table('players', function (Blueprint $table) {
            $table->dropIndex('players_team_idx');
            $table->dropIndex('players_role_idx');
            $table->dropIndex('players_rating_idx');
        });
    }
};
