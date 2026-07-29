<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_match_agents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('player_id');
            $table->uuid('match_id');
            $table->uuid('map_id');
            $table->string('agent_name');
            $table->timestamps();

            // Unique constraint to prevent duplicate scraping records
            $table->unique(['player_id', 'match_id', 'map_id', 'agent_name'], 'player_map_agent_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_match_agents');
    }
};
