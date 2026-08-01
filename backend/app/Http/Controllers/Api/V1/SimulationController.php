<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Player;
use Illuminate\Support\Facades\DB;

class SimulationController extends Controller
{
    /**
     * Endpoint to get player recommendations based on the current roster.
     */
    public function getRecommendations(Request $request)
    {
        $rosterIds = $request->input('roster', []);
        
        // If roster is empty, just return the top players overall
        if (empty($rosterIds)) {
            $players = Player::orderBy('avg_rating', 'desc')
                ->with('team')
                ->limit(20)
                ->get();
            
            $results = $players->map(function ($player) {
                return [
                    'player' => $player,
                    'synergy_score' => 0,
                    'reason' => 'Top rated player. Great starting pick.'
                ];
            });
            return response()->json($results);
        }

        $roster = Player::whereIn('id', $rosterIds)->with('team')->get();
        
        // Analyze roster
        $roles = $roster->pluck('current_role')->map(fn($r) => strtolower($r))->toArray();
        $hasController = in_array('controller', $roles);
        $hasInitiator = in_array('initiator', $roles);
        $hasSentinel = in_array('sentinel', $roles);
        $hasDuelist = in_array('duelist', $roles);
        
        $hasIgl = $roster->where('is_igl', true)->count() > 0;
        
        $avgFk = $roster->avg('avg_fk');
        $avgKast = $roster->avg('avg_kast');
        
        // Regional dominance
        $regions = [];
        foreach ($roster as $p) {
            if ($p->team && $p->team->region) {
                $regions[$p->team->region] = ($regions[$p->team->region] ?? 0) + 1;
            }
        }
        arsort($regions);
        $dominantRegion = key($regions);

        // Fetch candidates (exclude already in roster)
        $candidates = Player::whereNotIn('id', $rosterIds)
            ->with('team')
            ->where('avg_rating', '>', 0.9)
            ->get();

        $recommendations = [];

        foreach ($candidates as $candidate) {
            $score = 0;
            $reasons = [];

            // 1. Role Complement
            $cRole = strtolower($candidate->current_role);
            if (!$hasController && $cRole === 'controller') {
                $score += 30;
                $reasons[] = 'Fills the missing Controller role.';
            }
            if (!$hasInitiator && $cRole === 'initiator') {
                $score += 20;
                $reasons[] = 'Fills the missing Initiator role.';
            }
            if (!$hasSentinel && $cRole === 'sentinel') {
                $score += 15;
                $reasons[] = 'Fills the missing Sentinel role.';
            }
            if (!$hasDuelist && $cRole === 'duelist') {
                $score += 20;
                $reasons[] = 'Provides much needed entry firepower.';
            }

            // Penalty for role stacking
            $roleCount = count(array_keys($roles, $cRole));
            if ($roleCount >= 2) {
                $score -= 30; // 3 of same role is bad
            } elseif ($roleCount == 1 && $cRole === 'duelist') {
                // double duelist is fine but not heavily boosted unless needed
                $score += 5;
            } elseif ($roleCount == 1) {
                $score -= 10;
            }

            // 2. IGL Check
            if (!$hasIgl && $candidate->is_igl) {
                $score += 40;
                $reasons[] = 'Provides crucial In-Game Leadership (IGL).';
            }

            // 3. Aggression Balance
            $cTags = $candidate->playstyle_tags;
            if ($avgFk > 0.14) {
                // Team is aggressive, needs support/anchor
                if (in_array('Supportive', $cTags) || in_array('Anchor', $cTags)) {
                    $score += 25;
                    $reasons[] = 'Balances the team\'s high aggression with stable supportive play.';
                }
            } elseif ($avgFk > 0 && $avgFk < 0.11) {
                // Team is passive, needs entry
                if (in_array('Aggressive', $cTags) || in_array('Fragger', $cTags)) {
                    $score += 25;
                    $reasons[] = 'Adds aggressive entry potential to a passive roster.';
                }
            }

            // 4. Regional Synergy
            if ($dominantRegion && $candidate->team && $candidate->team->region === $dominantRegion) {
                $score += 10;
                $reasons[] = "Regional synergy ({$dominantRegion}).";
            }

            // Base score based on player rating (0-20 points)
            $score += ($candidate->avg_rating - 0.9) * 40;

            if ($score > 10) {
                $recommendations[] = [
                    'player' => $candidate,
                    'synergy_score' => round($score),
                    'reason' => implode(' ', $reasons) ?: 'Solid overall addition.'
                ];
            }
        }

        // Sort by synergy score desc
        usort($recommendations, function ($a, $b) {
            return $b['synergy_score'] <=> $a['synergy_score'];
        });

        return response()->json(array_slice($recommendations, 0, 20));
    }
}
