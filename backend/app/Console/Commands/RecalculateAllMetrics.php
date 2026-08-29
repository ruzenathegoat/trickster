<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RecalculateAllMetrics extends Command
{
    protected $signature = 'metrics:recalculate-all
                            {season? : Four-digit season; defaults to the latest completed match}
                            {--no-smart : Do not refresh SMART results after CQI}';

    protected $description = 'Resolve stage profiles and rebuild all season-wide CQI v3 metrics';

    public function handle(): int
    {
        $arguments = [];
        if ($this->argument('season') !== null) {
            $arguments['season'] = $this->argument('season');
        }
        if ($this->option('no-smart')) {
            $arguments['--no-smart'] = true;
        }

        return $this->call('metrics:recalculate-competition-quality', $arguments);
    }
}
