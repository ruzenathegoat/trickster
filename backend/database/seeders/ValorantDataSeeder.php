<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Patch;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ValorantDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Agents
        DB::table('agent_role_map')->truncate();

        $agents = [
            // Duelists
            ['agent' => 'Jett', 'primary_role' => 'Duelist'],
            ['agent' => 'Phoenix', 'primary_role' => 'Duelist'],
            ['agent' => 'Reyna', 'primary_role' => 'Duelist'],
            ['agent' => 'Raze', 'primary_role' => 'Duelist'],
            ['agent' => 'Yoru', 'primary_role' => 'Duelist'],
            ['agent' => 'Neon', 'primary_role' => 'Duelist'],
            ['agent' => 'Iso', 'primary_role' => 'Duelist'],
            // Initiators
            ['agent' => 'Sova', 'primary_role' => 'Initiator'],
            ['agent' => 'Breach', 'primary_role' => 'Initiator'],
            ['agent' => 'Skye', 'primary_role' => 'Initiator'],
            ['agent' => 'KAY/O', 'primary_role' => 'Initiator'],
            ['agent' => 'Fade', 'primary_role' => 'Initiator'],
            ['agent' => 'Gekko', 'primary_role' => 'Initiator'],
            // Controllers
            ['agent' => 'Brimstone', 'primary_role' => 'Controller'],
            ['agent' => 'Viper', 'primary_role' => 'Controller'],
            ['agent' => 'Omen', 'primary_role' => 'Controller'],
            ['agent' => 'Astra', 'primary_role' => 'Controller'],
            ['agent' => 'Harbor', 'primary_role' => 'Controller'],
            ['agent' => 'Clove', 'primary_role' => 'Controller'],
            ['agent' => 'Miks', 'primary_role' => 'Controller'],
            // Sentinels
            ['agent' => 'Killjoy', 'primary_role' => 'Sentinel'],
            ['agent' => 'Cypher', 'primary_role' => 'Sentinel'],
            ['agent' => 'Sage', 'primary_role' => 'Sentinel'],
            ['agent' => 'Chamber', 'primary_role' => 'Sentinel'],
            ['agent' => 'Deadlock', 'primary_role' => 'Sentinel'],
            ['agent' => 'Vyse', 'primary_role' => 'Sentinel'],
            ['agent' => 'Vyse', 'primary_role' => 'Sentinel'],
        ];

        DB::table('agent_role_map')->insert($agents);

        // 2. Seed Patches
        DB::table('patches')->truncate();
        
        $patches = [
            '11.10', '11.11', '11.12', '11.13', '11.14',
            '12.00', '12.01', '12.02', '12.03', '12.04', '12.05', '12.06', '12.07', '12.08', '12.09', '12.10',
            '13.00', '13.01', '13.02'
        ];
        
        $latestDate = Carbon::now()->subDays(7);
        $baseDate = $latestDate->copy()->subDays(14 * (count($patches) - 1));

        foreach ($patches as $version) {
            Patch::create([
                'id' => Str::uuid()->toString(),
                'version' => $version,
                'release_date' => $baseDate->copy()->addDays(14 * array_search($version, $patches)),
                'patch_notes_url' => 'https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-' . str_replace('.', '-', $version) . '/',
            ]);
        }
    }
}
