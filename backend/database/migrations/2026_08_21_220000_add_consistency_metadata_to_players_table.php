<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->unsignedInteger('consistency_sample_size')->default(0);
            $table->unsignedSmallInteger('consistency_event_count')->default(0);
            $table->string('consistency_method')->nullable();
            $table->timestamp('consistency_calculated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn([
                'consistency_sample_size',
                'consistency_event_count',
                'consistency_method',
                'consistency_calculated_at',
            ]);
        });
    }
};
