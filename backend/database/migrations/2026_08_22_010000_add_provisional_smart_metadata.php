<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->decimal('consistency_provisional_index', 5, 2)->nullable();
        });

        Schema::table('player_smart_results', function (Blueprint $table) {
            $table->boolean('is_provisional')->default(false);
            $table->decimal('smart_confidence', 5, 4)->default(1);
            $table->index(
                ['is_provisional', 'mode', 'final_score'],
                'psr_verified_mode_score_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::table('player_smart_results', function (Blueprint $table) {
            $table->dropIndex('psr_verified_mode_score_idx');
            $table->dropColumn(['is_provisional', 'smart_confidence']);
        });

        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn('consistency_provisional_index');
        });
    }
};
