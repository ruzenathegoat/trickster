<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ValorantMapController extends Controller
{
    public function index()
    {
        $maps = \App\Models\ValorantMap::where('is_active', true)->get();
        return response()->json($maps);
    }
}
