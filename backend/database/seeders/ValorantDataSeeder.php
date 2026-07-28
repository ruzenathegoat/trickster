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
        ];

        DB::table('agent_role_map')->insert($agents);

        // 2. Seed Patches
        DB::table('patches')->truncate();
        
        $baseDate = Carbon::parse('2024-01-09'); // approximate ep 8 act 1 start
        $patches = [
            '8.00', '8.01', '8.02', '8.03', '8.04', '8.05', '8.07', '8.08', '8.09', '8.11',
            '9.00', '9.01', '9.02', '9.03', '9.04', '9.05', '9.06', '9.07', '9.08'
        ];

        foreach ($patches as $version) {
            Patch::create([
                'id' => Str::uuid()->toString(),
                'version' => $version,
                'release_date' => $baseDate->copy()->addDays(14 * array_search($version, $patches)),
                'patch_notes_url' => 'https://playvalorant.com/en-us/news/tags/patch-notes/' . str_replace('.', '-', $version) . '/',
            ]);
        }
    }
}
