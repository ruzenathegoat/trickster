<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Player;

class CalculateSmartJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $matchId;
    public $players;

    public function __construct(string $matchId, array $players)
    {
        $this->matchId = $matchId;
        $this->players = $players;
    }

    public function handle(): void
    {
        // 1. Calculate Smart Result for these players
        // (Machine learning model scoring would happen here)
        
        // 2. Dispatch ScrapePlayerProfileJob for players missing a photo
        foreach ($this->players as $playerModel) {
            // Re-fetch player to ensure we have latest data
            $player = Player::find($playerModel->id);
            if ($player && !$player->photo_url) {
                ScrapePlayerProfileJob::dispatch($player)->onQueue("scrape-low");
            }
        }
    }
}

