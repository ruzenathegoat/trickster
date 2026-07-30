<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\ValorantAgent;

class SyncValorantAgentsCommand extends Command
{
    protected $signature = 'valorant:sync-agents';
    protected $description = 'Fetch all playable agents from valorant-api.com and upsert into valorant_agents table';

    public function handle(): int
    {
        $this->info('Fetching agents from valorant-api.com...');

        $response = Http::get('https://valorant-api.com/v1/agents', [
            'isPlayableCharacter' => 'true',
        ]);

        if (!$response->ok()) {
            $this->error('API request failed: ' . $response->status());
            return self::FAILURE;
        }

        $agents = $response->json('data');

        if (empty($agents)) {
            $this->warn('No agents returned from API.');
            return self::FAILURE;
        }

        $count = 0;
        foreach ($agents as $agent) {
            ValorantAgent::updateOrCreate(
                ['api_uuid' => $agent['uuid']],
                [
                    'name'         => $agent['displayName'],
                    'role'         => $agent['role']['displayName'] ?? 'Unknown',
                    'icon_url'     => $agent['displayIcon'] ?? null,
                    'portrait_url' => $agent['fullPortrait'] ?? null,
                ]
            );
            $count++;
        }

        $this->info("Synced {$count} agents successfully.");
        return self::SUCCESS;
    }
}
