<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maps', function (Blueprint $table) {
            $table->string('valorant_map_name')->nullable()->after('map_name');
        });

        Schema::table('agent_pick_rate_snapshots', function (Blueprint $table) {
            $table->string('valorant_map_name')->nullable()->after('map_id');
        });
    }

    public function down(): void
    {
        Schema::table('agent_pick_rate_snapshots', function (Blueprint $table) {
            $table->dropColumn('valorant_map_name');
        });

        Schema::table('maps', function (Blueprint $table) {
            $table->dropColumn('valorant_map_name');
        });
    }
};
