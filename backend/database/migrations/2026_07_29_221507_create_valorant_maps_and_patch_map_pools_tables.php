<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Master list of all Valorant maps
        Schema::create('valorant_maps', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name')->unique();
            $table->boolean('is_active')->default(true); // false = map removed from game
            $table->timestamps();
        });

        // Per-patch map pool (which maps are in rotation for a given patch)
        Schema::create('patch_map_pools', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('patch_id');
            $table->string('map_name');
            $table->foreign('patch_id')->references('id')->on('patches')->onDelete('cascade');
            $table->unique(['patch_id', 'map_name']);
        });

        // Seed master list
        $maps = [
            'Abyss', 'Ascent', 'Bind', 'Breeze', 'Corrode', 'Fracture',
            'Haven', 'Icebox', 'Lotus', 'Pearl', 'Split', 'Summit', 'Sunset',
        ];
        foreach ($maps as $map) {
            DB::table('valorant_maps')->insert(['name' => $map]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('patch_map_pools');
        Schema::dropIfExists('valorant_maps');
    }
};
