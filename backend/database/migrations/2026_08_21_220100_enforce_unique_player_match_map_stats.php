<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->unique(
                ['player_id', 'match_id', 'map_id'],
                'player_map_stats_observation_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->dropUnique('player_map_stats_observation_unique');
        });
    }
};
