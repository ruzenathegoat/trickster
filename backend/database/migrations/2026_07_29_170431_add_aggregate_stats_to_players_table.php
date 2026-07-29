<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
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
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn([
                'total_matches', 'total_wins', 'win_rate',
                'avg_acs', 'avg_kd', 'avg_kast', 'avg_adr', 'avg_rating',
                'total_kills', 'total_deaths', 'total_assists',
            ]);
        });
    }
};
