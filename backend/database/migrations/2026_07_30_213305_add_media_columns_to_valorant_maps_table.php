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
        Schema::table('valorant_maps', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
            $table->string('display_icon')->nullable();
            $table->string('list_view_icon')->nullable();
            $table->string('splash_url')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('valorant_maps', function (Blueprint $table) {
            $table->dropColumn(['uuid', 'display_icon', 'list_view_icon', 'splash_url']);
        });
    }
};
