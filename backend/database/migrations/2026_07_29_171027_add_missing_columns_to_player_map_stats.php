<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->foreignUuid('match_id')->nullable()->constrained('matches')->nullOnDelete();
            $table->integer('kills')->default(0);
            $table->integer('deaths')->default(0);
            $table->integer('assists')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('player_map_stats', function (Blueprint $table) {
            $table->dropForeign(['match_id']);
            $table->dropColumn(['match_id', 'kills', 'deaths', 'assists']);
        });
    }
};
