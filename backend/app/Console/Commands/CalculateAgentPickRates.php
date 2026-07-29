<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Event;
use App\Models\MatchData;
use Illuminate\Support\Str;

class CalculateAgentPickRates extends Command
{
    protected $signature = 'trickster:calc-pick-rates {--event=} {--all}';
    protected $description = 'Calculate agent pick rates per event and per map within an event';

    public function handle()
    {
        if ($this->option('all')) {
            $events = Event::all();
        } elseif ($eventId = $this->option('event')) {
            $events = Event::where('id', $eventId)->get();
        } else {
            $this->error("Please specify --all or --event={id}");
            return;
        }

        foreach ($events as $event) {
            $this->info("Calculating pick rates for event: {$event->name}");
            
            // Delete old snapshots for this event
            DB::table('agent_pick_rate_snapshots')->where('event_id', $event->id)->delete();
            
            // Get all matches for this event
            $matchIds = MatchData::where('event_id', $event->id)->pluck('id');
            
            if ($matchIds->isEmpty()) continue;
            
            // Per map
            $mapStats = DB::table('player_match_agents')
                ->whereIn('match_id', $matchIds)
                ->select('map_id', 'agent_name', DB::raw('count(*) as picks'))
                ->groupBy('map_id', 'agent_name')
                ->get();
                
            $mapTotals = DB::table('player_match_agents')
                ->whereIn('match_id', $matchIds)
                ->select('map_id', DB::raw('count(distinct match_id) as total_matches'))
                ->groupBy('map_id')
                ->get()
                ->keyBy('map_id');
                
            $snapshots = [];
            foreach ($mapStats as $stat) {
                $totalMatchesForMap = $mapTotals->get($stat->map_id)->total_matches ?? 1;
                // Max 10 players per map -> 2 teams -> Pick rate per team = (picks / (total maps * 2)) * 100
                $pickRate = ($stat->picks / ($totalMatchesForMap * 2)) * 100;
                
                $snapshots[] = [
                    'id' => Str::uuid()->toString(),
                    'event_id' => $event->id,
                    'map_id' => $stat->map_id,
                    'agent_name' => strtolower($stat->agent_name),
                    'pick_rate' => round($pickRate, 2),
                    'total_picks' => $stat->picks,
                    'total_matches' => $totalMatchesForMap,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            
            // Overall for event (map_id = null)
            $overallStats = DB::table('player_match_agents')
                ->whereIn('match_id', $matchIds)
                ->select('agent_name', DB::raw('count(*) as picks'))
                ->groupBy('agent_name')
                ->get();
                
            $totalMapsPlayed = DB::table('player_match_agents')
                ->whereIn('match_id', $matchIds)
                ->select(DB::raw("count(distinct concat(match_id, '-', map_id)) as total_maps"))
                ->first()->total_maps ?? 1;
                
            foreach ($overallStats as $stat) {
                $pickRate = ($stat->picks / ($totalMapsPlayed * 2)) * 100;
                $snapshots[] = [
                    'id' => Str::uuid()->toString(),
                    'event_id' => $event->id,
                    'map_id' => null,
                    'agent_name' => strtolower($stat->agent_name),
                    'pick_rate' => round($pickRate, 2),
                    'total_picks' => $stat->picks,
                    'total_matches' => $totalMapsPlayed,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            
            DB::table('agent_pick_rate_snapshots')->insert($snapshots);
            $this->info("Inserted " . count($snapshots) . " snapshots.");
        }
    }
}
