<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->string('role_archetype')->nullable()->after('current_role');
            $table->string('flex_confidence')->nullable()->after('flexibility_score');
            $table->json('flex_profile')->nullable()->after('flex_confidence');
            $table->timestamp('role_profile_calculated_at')->nullable()->after('flex_profile');
            $table->string('meta_adaptability_confidence')->nullable()->after('meta_adaptability_index');
            $table->json('meta_adaptability_profile')->nullable()->after('meta_adaptability_confidence');
            $table->timestamp('meta_adaptability_calculated_at')->nullable()->after('meta_adaptability_profile');
            $table->index('role_archetype', 'players_role_archetype_idx');
        });

        $waylay = DB::table('agent_role_maps')
            ->whereRaw('LOWER(agent_name) = ?', ['waylay'])
            ->first();

        if ($waylay) {
            DB::table('agent_role_maps')
                ->where('id', $waylay->id)
                ->update([
                    'role_name' => 'duelist',
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('agent_role_maps')->insert([
                'id' => Str::uuid()->toString(),
                'agent_name' => 'waylay',
                'role_name' => 'duelist',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropIndex('players_role_archetype_idx');
            $table->dropColumn([
                'role_archetype',
                'flex_confidence',
                'flex_profile',
                'role_profile_calculated_at',
                'meta_adaptability_confidence',
                'meta_adaptability_profile',
                'meta_adaptability_calculated_at',
            ]);
        });
    }
};
