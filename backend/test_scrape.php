<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

dump('Starting...');
$response = Illuminate\Support\Facades\Http::timeout(5)->withoutVerifying()->withHeaders([
    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
])->get('https://www.vlr.gg/events');
dump('Status: ' . $response->status());
dump('Length: ' . strlen($response->body()));
