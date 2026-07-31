<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ValorantAgent;
use Illuminate\Http\Request;

class ValorantAgentController extends Controller
{
    /**
     * Get all valorant agents with their photos
     */
    public function index(Request $request)
    {
        $agents = \Illuminate\Support\Facades\Cache::rememberForever('api_valorant_agents', function() {
            return ValorantAgent::all()->toArray();
        });
        
        return response()->json([
            'data' => $agents
        ]);
    }
}
