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
        Schema::table('players', function (Blueprint $table) {
            $table->float('meta_alignment_score')->default(0);
            $table->float('flexibility_score')->default(0);
            $table->float('meta_adaptability_index')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn([
                'meta_alignment_score',
                'flexibility_score',
                'meta_adaptability_index'
            ]);
        });
    }
};
