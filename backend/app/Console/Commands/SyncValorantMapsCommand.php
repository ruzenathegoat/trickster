<?php

namespace App\Console\Commands;

use App\Models\ValorantMap;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncValorantMapsCommand extends Command
{
    protected $signature = 'valorant:sync-maps';
    protected $description = 'Fetch maps and their media from valorant-api.com';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fetching maps from valorant-api.com...');

        $response = Http::withoutVerifying()->get('https://valorant-api.com/v1/maps');
        
        if (!$response->successful()) {
            $this->error('Failed to fetch maps from API.');
            return Command::FAILURE;
        }

        $maps = $response->json('data');
        $count = 0;

        foreach ($maps as $mapData) {
            $name = $mapData['displayName'];
            
            // Skip The Range if we don't want it, though it might be useful.
            $map = ValorantMap::where('name', $name)->first();
            
            if ($map) {
                $map->update([
                    'uuid' => $mapData['uuid'],
                    'display_icon' => $mapData['displayIcon'] ?? null,
                    'list_view_icon' => $mapData['listViewIcon'] ?? null,
                    'splash_url' => $mapData['splash'] ?? null,
                ]);
                $count++;
            } else {
                // If map doesn't exist, maybe we create it
                ValorantMap::create([
                    'name' => $name,
                    'is_active' => true,
                    'uuid' => $mapData['uuid'],
                    'display_icon' => $mapData['displayIcon'] ?? null,
                    'list_view_icon' => $mapData['listViewIcon'] ?? null,
                    'splash_url' => $mapData['splash'] ?? null,
                ]);
                $count++;
            }
        }

        $this->info("Successfully synced {$count} maps.");
        return Command::SUCCESS;
    }
}
