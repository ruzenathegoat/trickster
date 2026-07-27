<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Player;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function index(Request $request)
    {
        $query = Player::with(['team', 'smartResults' => function ($q) {
            $q->where('mode', 'global')->latest('calculated_at');
        }]);

        if ($request->has('q')) {
            $query->where('ign', 'ilike', '%' . $request->q . '%')
                  ->orWhere('name', 'ilike', '%' . $request->q . '%');
        }

        if ($request->has('role')) {
            $query->where('current_role', $request->role);
        }

        return response()->json($query->paginate(20));
    }

    public function show($id)
    {
        $player = Player::with([
            'team',
            'mapStats.map',
            'criteriaScores.criteria',
            'smartResults' => function ($q) { $q->where('mode', 'global'); }
        ])->findOrFail($id);
        
        return response()->json($player);
    }
}