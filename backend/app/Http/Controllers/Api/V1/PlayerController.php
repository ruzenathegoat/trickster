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
            $q->where('mode', 'career')->latest('calculated_at');
        }]);

        if ($request->has('q') && !empty($request->q)) {
            $query->where(function($q) use ($request) {
                $q->where('ign', 'like', '%' . $request->q . '%')
                  ->orWhere('name', 'like', '%' . $request->q . '%');
            });
        }

        if ($request->has('role') && $request->role !== 'All') {
            $query->where('current_role', $request->role);
        }

        $query->orderBy('ign', 'asc');

        return response()->json($query->paginate(20));
    }

    public function show($id)
    {
        $player = Player::with([
            'team',
            'mapStats.map',
            'criteriaScores.criteria',
            'smartResults' => function ($q) { $q->where('mode', 'career'); }
        ])->findOrFail($id);
        
        return response()->json($player);
    }
}