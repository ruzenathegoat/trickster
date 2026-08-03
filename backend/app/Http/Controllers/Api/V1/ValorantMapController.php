<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ValorantMap;
use Illuminate\Support\Facades\Cache;

class ValorantMapController extends Controller
{
    public function index()
    {
        // Versioned key so admin map add/toggle (which bumps
        // api_admin_cache_version) invalidates this automatically.
        $version = Cache::get('api_admin_cache_version', 1);
        $maps = Cache::remember('api_valorant_maps_active_v' . $version, 3600, function () {
            return ValorantMap::where('is_active', true)->get();
        });
        return response()->json($maps);
    }
}
