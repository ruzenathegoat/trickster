<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ValorantMap;

class ValorantMapController extends Controller
{
    public function index()
    {
        $maps = ValorantMap::where('is_active', true)->get();
        return response()->json($maps);
    }
}
