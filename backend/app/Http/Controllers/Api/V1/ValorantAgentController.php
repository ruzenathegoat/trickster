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
        $agents = ValorantAgent::all();
        
        return response()->json([
            'data' => $agents
        ]);
    }
}
