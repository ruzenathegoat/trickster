<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Team;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

class ScrapeTeamLogos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:scrape-team-logos {--force : Update all teams even if they already have logo/region}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape missing team logos and regions from vlr.gg';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        $query = Team::whereNotNull('vlr_team_id');
        
        if (!$force) {
            $query->where(function ($q) {
                $q->whereNull('logo_url')->orWhereNull('region');
            });
        }
        
        $teams = $query->get();
        $this->info("Found {$teams->count()} teams to process.");
        
        $client = new Client(['verify' => false]); // avoid SSL issues
        $bar = $this->output->createProgressBar($teams->count());
        $bar->start();
        
        foreach ($teams as $team) {
            try {
                $url = 'https://www.vlr.gg/team/' . $team->vlr_team_id;
                $response = $client->request('GET', $url);
                $html = (string) $response->getBody();
                
                $crawler = new Crawler($html);
                
                // Find logo
                $logoNode = $crawler->filter('.team-header-logo img');
                $logoUrl = $logoNode->count() > 0 ? $logoNode->attr('src') : null;
                
                if ($logoUrl) {
                    if (strpos($logoUrl, 'http') === false) {
                        $logoUrl = 'https:' . $logoUrl;
                    }
                } elseif (str_contains($html, 'https://owcdn.net/img/604558e0a133d.png')) {
                     // sometimes vlr uses this as default logo, maybe skip or save it anyway
                }
                
                // Find region
                $regionNode = $crawler->filter('.team-header-country');
                $region = $regionNode->count() > 0 ? trim($regionNode->text()) : null;
                
                // Extract country text nicely
                if ($region) {
                    // sometimes text is something like "United States" or could have weird whitespace
                    $region = preg_replace('/\s+/', ' ', $region);
                }
                // Calculate win rate from database
                $totalMatches = \App\Models\MatchData::where(function ($q) use ($team) {
                    $q->where('team_a_id', $team->id)->orWhere('team_b_id', $team->id);
                })->whereNotNull('winner_team_id')->count();


                $totalWins = \App\Models\MatchData::where('winner_team_id', $team->id)->count();

                $winRate = $totalMatches > 0 ? round(($totalWins / $totalMatches) * 100, 2) : null;
                
                $team->update([
                    'logo_url' => $logoUrl ?? $team->logo_url,
                    'region' => $region ?? $team->region,
                    'win_rate_2026' => $winRate,
                ]);
                
            } catch (\Exception $e) {
                $this->error("\nFailed for team {$team->name} (ID: {$team->vlr_team_id}): " . $e->getMessage());
            }
            
            // Add slight delay to be polite to vlr.gg
            usleep(200000); // 200ms
            $bar->advance();
        }
        
        $bar->finish();
        $this->info("\nTeam logos and regions updated successfully.");
    }
}
