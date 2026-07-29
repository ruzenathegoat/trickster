<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->dropColumn(['first_kills', 'first_deaths', 'role_at_time_of_match', 'clutch_wins']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->integer('first_kills')->default(0);
            $table->integer('first_deaths')->default(0);
            $table->string('role_at_time_of_match')->nullable();
            $table->integer('clutch_wins')->default(0);
        });
    }
};
