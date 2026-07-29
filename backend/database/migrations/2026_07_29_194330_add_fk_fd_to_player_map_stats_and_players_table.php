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
            $table->integer('fk')->nullable()->after('assists');
            $table->integer('fd')->nullable()->after('fk');
        });

        Schema::table('players', function (Blueprint $table) {
            $table->float('avg_fk')->nullable()->after('avg_assists');
            $table->float('avg_fd')->nullable()->after('avg_fk');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->dropColumn(['fk', 'fd']);
        });

        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn(['avg_fk', 'avg_fd']);
        });
    }
};
