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
        Schema::create('player_smart_rank_history', function (Blueprint $table) {
            $table->id();
            $table->uuid('player_id');
            $table->uuid('profile_id');
            $table->string('mode')->default('career');
            $table->bigInteger('patch_id')->nullable();
            $table->decimal('final_score', 12, 4);
            $table->integer('rank')->nullable();
            $table->date('snapshot_date');
            $table->timestamps();

            // Foreign keys
            $table->foreign('player_id')->references('id')->on('players')->onDelete('cascade');
            $table->foreign('profile_id')->references('id')->on('smart_weight_profiles')->onDelete('cascade');

            $table->unique(['player_id', 'profile_id', 'mode', 'snapshot_date'], 'psrh_unique_snapshot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_smart_rank_history');
    }
};
