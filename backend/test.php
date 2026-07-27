<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('/api/v1/players', 'GET');
$response = app()->handle($request);
echo "GET /api/v1/players\n";
echo substr($response->getContent(), 0, 500) . "...\n\n";

$request = Illuminate\Http\Request::create('/api/v1/smart/criteria', 'GET');
$response = app()->handle($request);
echo "GET /api/v1/smart/criteria\n";
echo substr($response->getContent(), 0, 500) . "...\n";
