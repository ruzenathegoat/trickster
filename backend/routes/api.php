<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\PlayerController;
use App\Http\Controllers\Api\V1\SmartEngineController;

use App\Http\Controllers\Api\V1\TestAuthController;
use App\Http\Controllers\Api\V1\AdminCurationController;

Route::prefix('v1/auth')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\V1\AuthController::class, 'login']);
    Route::post('/logout', [\App\Http\Controllers\Api\V1\AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('v1/admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Curation GET endpoints
    Route::get('/stage-mappings', [AdminCurationController::class, 'getStageMappings']);
    Route::get('/agent-patch-ratings', [AdminCurationController::class, 'getPatchRatings']);
    Route::get('/agent-map-ratings', [AdminCurationController::class, 'getMapRatings']);
    Route::get('/agent-map-ratings/by-patch/{patchId}', [AdminCurationController::class, 'getMapRatingsByPatch']);
    Route::get('/patches', [AdminCurationController::class, 'getPatches']);
    Route::get('/agents', [AdminCurationController::class, 'getAgents']);
    Route::get('/valorant-maps', [AdminCurationController::class, 'getValorantMaps']);
    Route::get('/patch-map-pool/{patchId}', [AdminCurationController::class, 'getPatchMapPool']);

    // Curation POST/PUT endpoints
    Route::post('/stage-mappings', [AdminCurationController::class, 'storeStageMapping']);
    Route::post('/valorant-maps', [AdminCurationController::class, 'addValorantMap']);
    Route::patch('/valorant-maps/{id}/toggle', [AdminCurationController::class, 'toggleValorantMap']);
    Route::post('/patch-map-pool', [AdminCurationController::class, 'savePatchMapPool']);
    Route::post('/agent-patch-ratings/bulk', [AdminCurationController::class, 'storeBulkPatchRatings']);
    Route::post('/agent-patch-ratings', [AdminCurationController::class, 'storePatchRating']);
    Route::post('/agent-map-ratings', [AdminCurationController::class, 'storeMapRating']);
    Route::post('/agent-map-ratings/bulk', [AdminCurationController::class, 'storeBulkMapRatings']);
    Route::post('/agent-map-ratings/auto-calc', [AdminCurationController::class, 'autoCalculateMapRatings']);
    Route::put('/agent-map-ratings/{id}/supersede', [AdminCurationController::class, 'supersedeMapRating']);
    
    // Users
    Route::apiResource('users', \App\Http\Controllers\Api\V1\AdminUserController::class);
    
    // Events
    Route::get('/events', [AdminCurationController::class, 'getEvents']);
    
    // Scraper
    Route::post('/scraper/fetch-events', [\App\Http\Controllers\Api\V1\AdminScraperController::class, 'fetchEvents']);
    Route::post('/scraper/process-queue', [\App\Http\Controllers\Api\V1\AdminScraperController::class, 'processQueue']);
    Route::get('/scraper/logs', [\App\Http\Controllers\Api\V1\AdminScraperController::class, 'getLogs']);
    Route::get('/scraper/queue-stats', [\App\Http\Controllers\Api\V1\AdminScraperController::class, 'getQueueStats']);
    Route::get('/scraper/alerts', [\App\Http\Controllers\Api\V1\AdminScraperController::class, 'getAlerts']);
});

Route::prefix('v1')->group(function () {
    Route::get('/players', [PlayerController::class, 'index']);
    Route::get('/players/{id}', [PlayerController::class, 'show']);

    Route::prefix('smart')->group(function () {
        Route::get('/criteria', [SmartEngineController::class, 'criteria']);
        Route::get('/profiles', [SmartEngineController::class, 'profiles']);
        Route::post('/profiles', [SmartEngineController::class, 'storeProfile']);
        Route::post('/calculate', [SmartEngineController::class, 'calculate']);
    });
    
    // User Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\Api\V1\DashboardController::class, 'index']);
    
    // Leaderboard & Players
    Route::get('/leaderboard/top', [\App\Http\Controllers\Api\V1\LeaderboardController::class, 'index']);
    Route::get('/leaderboard/players', [\App\Http\Controllers\Api\V1\LeaderboardController::class, 'players']);
    Route::get('/players/{id}', [\App\Http\Controllers\Api\V1\LeaderboardController::class, 'show']);

    // Teams
    Route::get('/teams/top', [\App\Http\Controllers\Api\V1\TeamController::class, 'top']);
    Route::get('/teams', [\App\Http\Controllers\Api\V1\TeamController::class, 'index']);
    Route::get('/teams/{id}', [\App\Http\Controllers\Api\V1\TeamController::class, 'show']);
});
