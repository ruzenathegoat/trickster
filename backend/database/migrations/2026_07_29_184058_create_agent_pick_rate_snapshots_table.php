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
        Schema::dropIfExists('agent_pick_rate_snapshots');
        Schema::create('agent_pick_rate_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignUuid('map_id')->nullable()->constrained('maps')->cascadeOnDelete();
            $table->string('agent_name');
            $table->float('pick_rate', 5, 2);
            $table->integer('total_picks');
            $table->integer('total_matches');
            $table->timestamps();

            // Make it easier to query pick rates
            $table->index(['event_id', 'map_id', 'agent_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_pick_rate_snapshots');
    }
};
