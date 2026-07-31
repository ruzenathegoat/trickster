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
        Schema::create('user_favorite_players', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('player_id');
            $table->timestamps();

            $table->unique(['user_id', 'player_id']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('player_id')->references('id')->on('players')->onDelete('cascade');
        });

        Schema::create('user_favorite_teams', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('team_id');
            $table->timestamps();

            $table->unique(['user_id', 'team_id']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_favorite_teams');
        Schema::dropIfExists('user_favorite_players');
    }
};
