<?php 
require __DIR__."/vendor/autoload.php"; 
$app = require_once __DIR__."/bootstrap/app.php"; 
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class); 
$kernel->bootstrap(); 
try { 
    app(App\Services\VlrScraperService::class)->runPipeline(); 
    echo "SUCCESS\n"; 
} catch (\Throwable $e) { 
    echo "ERROR: " . $e->getMessage() . "\n"; 
}
