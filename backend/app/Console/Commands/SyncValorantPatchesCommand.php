<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncValorantPatchesCommand extends Command
{
    protected $signature = 'valorant:sync-patches';
    protected $description = 'Sync valorant patch notes from playvalorant.com';

    public function handle()
    {
        $this->info('Fetching patch notes from playvalorant.com...');
        
        $response = Http::withoutVerifying()->get("https://playvalorant.com/id-id/news/tags/patch-notes/");
        
        if (!preg_match("/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/s", $response->body(), $matches)) {
            $this->error('Failed to find __NEXT_DATA__ in HTML');
            return Command::FAILURE;
        }

        $data = json_decode($matches[1], true);
        $items = [];
        
        $this->findItems($data, $items);
        $count = 0;

        foreach ($items as $item) {
            if (preg_match("/1[2-3]\.\d{2}/", $item["title"], $v)) {
                $version = $v[0];
                
                // Skip if not in the requested range (12.01 to 13.02)
                if (version_compare($version, '12.01', '<') || version_compare($version, '13.02', '>')) {
                    continue;
                }

                $date = \Carbon\Carbon::parse($item["analytics"]["publishDate"]);
                $url = "https://playvalorant.com" . $item["action"]["payload"]["url"];

                \App\Models\Patch::updateOrCreate(
                    ['version' => $version],
                    [
                        'release_date' => $date,
                        'patch_notes_url' => $url
                    ]
                );
                $count++;
                $this->line("Synced Patch $version");
            }
        }
        
        $this->info("Successfully synced $count patches.");
        return Command::SUCCESS;
    }

    private function findItems($arr, &$foundItems)
    {
        foreach ($arr as $k => $v) {
            if ($k === "items" && is_array($v) && isset($v[0]["title"]) && isset($v[0]["action"])) {
                $foundItems = array_merge($foundItems, $v);
                // Don't return, keep searching in case there are multiple article grids
            }
            if (is_array($v)) {
                $this->findItems($v, $foundItems);
            }
        }
    }
}
