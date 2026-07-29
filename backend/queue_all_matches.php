<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (\App\Models\MatchData::all() as $match) {
    echo "Queueing match {$match->vlr_match_id}...\n";
    \App\Jobs\ParseMatchJob::dispatch($match->vlr_match_id)->onQueue('scrape-low');
}
echo "Done!\n";
