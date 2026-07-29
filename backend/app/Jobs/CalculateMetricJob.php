<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CalculateMetricJob implements ShouldQueue
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
        // 1. Logic to calculate base metrics from PlayerMapStat
        // e.g. calculating KD Ratio, KAST, etc. if they need aggregation
        
        // 2. Pass to the next phase: AI Smart Results
        CalculateSmartJob::dispatch($this->matchId, $this->players);
    }
}

