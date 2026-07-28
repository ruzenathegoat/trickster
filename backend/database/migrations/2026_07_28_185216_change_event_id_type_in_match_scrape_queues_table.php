<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table("match_scrape_queues", function (Blueprint $table) {
            $table->dropColumn("event_id");
        });
        Schema::table("match_scrape_queues", function (Blueprint $table) {
            $table->uuid("event_id")->nullable();
        });
    }

    public function down(): void
    {
        Schema::table("match_scrape_queues", function (Blueprint $table) {
            $table->dropColumn("event_id");
        });
        Schema::table("match_scrape_queues", function (Blueprint $table) {
            $table->unsignedBigInteger("event_id")->nullable();
        });
    }
};
