<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Player;
use App\Models\Patch;
use App\Models\AgentPatchRating;
use App\Models\MatchData;
use App\Models\PlayerMapStat;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CalculateMetaAdaptabilityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900;
    public $tries = 3;

    protected $players;

    public function __construct(array $players = [])
    {
        $this->players = $players;
    }

    public function handle(): void
    {
        try {
        if (empty($this->players)) {
            // Master job: Dispatch sub-jobs in chunks of 10 players to avoid queue timeout
            Player::chunk(10, function ($players) {
                self::dispatch($players->toArray());
            });
            return;
        }

        $playersToProcess = Player::whereIn('id', collect($this->players)->pluck('id'))->get();
        $patches = Patch::orderBy('release_date', 'asc')->get();
        
        $tierScores = [
            'S' => 5,
            'A' => 4,
            'B' => 3,
            'C' => 2,
            'D' => 1
        ];

        foreach ($playersToProcess as $player) {
            $alignmentScores = [];
            $agentPerPatch = []; // Store the most played agent per patch for flexibility
            
            foreach ($patches as $patch) {
                // Determine patch end date
                $nextPatch = $patches->where('release_date', '>', $patch->release_date)->first();
                $endDate = $nextPatch ? $nextPatch->release_date : Carbon::now()->addYear();
                
                // Get all agent picks for this player in this patch
                $statsInPatch = DB::table('player_match_agents')
                    ->join('matches', 'player_match_agents.match_id', '=', 'matches.id')
                    ->where('player_match_agents.player_id', $player->id)
                    ->whereBetween('matches.match_date', [$patch->release_date, $endDate])
                    ->get();
                
                if ($statsInPatch->isEmpty()) continue;
                
                $agentCounts = [];
                
                foreach ($statsInPatch as $stat) {
                    $agent = $stat->agent_name;
                    if (!$agent) continue;
                    
                    $agentCounts[$agent] = ($agentCounts[$agent] ?? 0) + 1;
                    
                    // Get base tier from AgentPatchRating
                    $baseRating = AgentPatchRating::where('patch_id', $patch->id)->where('agent', 'ILIKE', $agent)->first();
                    if (!$baseRating || !isset($tierScores[$baseRating->tier])) continue;
                    
                    $baseScore = $tierScores[$baseRating->tier];
                    
                    // Calculate map pick rate for this agent during this patch
                    $totalMatchesOnMap = DB::table('player_match_agents')
                        ->join('matches', 'player_match_agents.match_id', '=', 'matches.id')
                        ->where('player_match_agents.map_id', $stat->map_id)
                        ->whereBetween('matches.match_date', [$patch->release_date, $endDate])
                        ->count();
                        
                    $agentMatchesOnMap = DB::table('player_match_agents')
                        ->join('matches', 'player_match_agents.match_id', '=', 'matches.id')
                        ->where('player_match_agents.map_id', $stat->map_id)
                        ->where('player_match_agents.agent_name', $agent)
                        ->whereBetween('matches.match_date', [$patch->release_date, $endDate])
                        ->count();
                    
                    $pickRate = $totalMatchesOnMap > 0 ? ($agentMatchesOnMap / $totalMatchesOnMap) * 100 : 0;
                    
                    // Modify tier score based on pick rate threshold (as per spec: >30% +1, <5% -1)
                    $mapScore = $baseScore;
                    if ($pickRate > 30) {
                        $mapScore += 1;
                    } elseif ($pickRate < 5) {
                        $mapScore -= 1;
                    }
                    
                    // Cap score between 1 and 5
                    $mapScore = max(1, min(5, $mapScore));
                    $alignmentScores[] = $mapScore;
                }
                
                // Track most played agent for this patch
                arsort($agentCounts);
                $mostPlayedAgent = array_key_first($agentCounts);
                
                $baseRating = AgentPatchRating::where('patch_id', $patch->id)->where('agent', 'ILIKE', $mostPlayedAgent)->first();
                $agentPerPatch[$patch->id] = [
                    'agent' => $mostPlayedAgent,
                    'tier_score' => $baseRating && isset($tierScores[$baseRating->tier]) ? $tierScores[$baseRating->tier] : 3
                ];
            }
            
            // Calculate Meta Alignment Score (Average of all matches map scores)
            $metaAlignmentScore = count($alignmentScores) > 0 ? array_sum($alignmentScores) / count($alignmentScores) : 0;
            // Convert to 100 scale: (Score - 1) / 4 * 100
            $metaAlignmentScoreScale100 = $metaAlignmentScore > 0 ? (($metaAlignmentScore - 1) / 4) * 100 : 0;
            
            // Calculate Flexibility Score
            $flexibilityScores = [];
            $previousPatchData = null;
            
            foreach ($patches as $patch) {
                if (!isset($agentPerPatch[$patch->id])) continue;
                
                $currentPatchData = $agentPerPatch[$patch->id];
                
                if ($previousPatchData) {
                    $prevAgent = $previousPatchData['agent'];
                    $prevTierInOldPatch = $previousPatchData['tier_score'];
                    
                    // What is the prev agent's tier in the current patch?
                    $prevAgentRatingInCurrentPatch = AgentPatchRating::where('patch_id', $patch->id)->where('agent', 'ILIKE', $prevAgent)->first();
                    $prevAgentTierInCurrentPatch = $prevAgentRatingInCurrentPatch && isset($tierScores[$prevAgentRatingInCurrentPatch->tier]) 
                        ? $tierScores[$prevAgentRatingInCurrentPatch->tier] 
                        : 3;
                    
                    $didAgentGetNerfed = $prevAgentTierInCurrentPatch < $prevTierInOldPatch;
                    $didPlayerSwitchAgent = $prevAgent !== $currentPatchData['agent'];
                    
                    if ($didPlayerSwitchAgent) {
                        // Switched agent. If they switched to an equal or better tier agent, high flexibility
                        if ($currentPatchData['tier_score'] >= $prevAgentTierInCurrentPatch) {
                            $flexibilityScores[] = 100;
                        } else {
                            $flexibilityScores[] = 50; // Switched, but to a worse agent
                        }
                    } else {
                        // Didn't switch
                        if ($didAgentGetNerfed) {
                            // Remained on a nerfed agent
                            $flexibilityScores[] = 0;
                        } else {
                            // Agent didn't get nerfed, staying is fine
                            $flexibilityScores[] = 50;
                        }
                    }
                }
                
                $previousPatchData = $currentPatchData;
            }
            
            $flexibilityScore = count($flexibilityScores) > 0 ? array_sum($flexibilityScores) / count($flexibilityScores) : 0;
            
            // Calculate Final Index
            $metaAdaptabilityIndex = ($metaAlignmentScoreScale100 * 0.6) + ($flexibilityScore * 0.4);
            
            $player->update([
                'meta_alignment_score' => $metaAlignmentScoreScale100,
                'flexibility_score' => $flexibilityScore,
                'meta_adaptability_index' => $metaAdaptabilityIndex
            ]);
        }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("CalculateMetaAdaptabilityJob failed: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            throw $e;
        }
    }
}
