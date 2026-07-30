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

        // Default sorting
        $sortBy = $request->input('sort_by', 'smart');
        $sortDir = $request->input('sort_dir', 'desc');
        
        $validSortDirs = ['asc', 'desc'];
        if (!in_array(strtolower($sortDir), $validSortDirs)) {
            $sortDir = 'desc';
        }

        switch (strtolower($sortBy)) {
            case 'acs':
                $query->orderBy('avg_acs', $sortDir);
                break;
            case 'kd':
                $query->orderBy('avg_kd', $sortDir);
                break;
            case 'adr':
                $query->orderBy('avg_adr', $sortDir);
                break;
            case 'fkfd':
                // Sort by (avg_fk - avg_fd)
                $query->orderByRaw('(avg_fk - avg_fd) ' . $sortDir);
                break;
            case 'smart':
            default:
                // Sort by smartResult.final_score
                // Since we eager load, we can't orderBy on relation directly without joining.
                // Let's join the player_smart_results table for sorting if needed,
                // OR we can join it explicitly
                $query->leftJoin('player_smart_results', function($join) {
                    $join->on('players.id', '=', 'player_smart_results.player_id')
                         ->where('player_smart_results.mode', '=', 'career');
                })
                ->select('players.*') // ensure we only select player columns
                ->orderBy('player_smart_results.final_score', $sortDir)
                ->orderBy('players.ign', 'asc');
                break;
        }

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