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
        Schema::table('users', function (Blueprint $table) {
            $table->string('theme_color')->nullable();
            $table->string('favorite_role')->nullable();
            $table->uuid('favorite_agent_id')->nullable();
            
            // Note: Not setting a foreign key constraint to valorant_agents right now 
            // to keep it simple, but conceptually points to valorant_agents.id
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['theme_color', 'favorite_role', 'favorite_agent_id']);
        });
    }
};
