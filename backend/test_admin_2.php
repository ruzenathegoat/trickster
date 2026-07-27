<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/api/v1/auth/login', 'POST', [
    'email' => 'admin@example.com',
    'password' => 'password'
]);
$response = $kernel->handle($request);
$data = json_decode($response->getContent(), true);

if (!isset($data['access_token'])) {
    echo "Login failed!\n";
    echo $response->getContent();
    exit;
}

$token = $data['access_token'];
echo "Logged in successfully. Token: $token\n\n";

$req = Illuminate\Http\Request::create('/api/v1/admin/stage-mappings', 'POST', [
    'raw_label' => 'Playoffs - Grand Final',
    'normalized_stage' => 'grand_final',
    'pressure_weight' => 2.0
]);
$req->headers->set('Authorization', 'Bearer ' . $token);
$res = $kernel->handle($req);

echo "POST /api/v1/admin/stage-mappings\n";
echo $res->getContent() . "\n";
