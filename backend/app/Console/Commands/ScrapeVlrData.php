<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ScrapeJobsLog;
use App\Models\ScrapeAlert;
use App\Services\VlrScraperService;

class ScrapeVlrData extends Command
{
    protected $signature = 'trickster:scrape {source=vlr.gg/matches}';
    protected $description = 'Run the VLR.gg data scraper pipeline';

    public function handle(VlrScraperService $scraper)
    {
        $source = $this->argument('source');
        $this->info("Starting scraper for source: {$source}");
        
        $log = ScrapeJobsLog::create([
            'source' => $source,
            'status' => 'success', // Assuming success initially
            'started_at' => now(),
        ]);
        
        try {
            // Scaffold: In the future, this calls actual scraping logic
            $recordsProcessed = $scraper->runPipeline($source);
            
            $log->update([
                'status' => 'success',
                'finished_at' => now(),
                'records_processed' => $recordsProcessed
            ]);
            
            $this->info("Scraping completed successfully. Records processed: {$recordsProcessed}");
        } catch (\Exception $e) {
            $log->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_message' => $e->getMessage()
            ]);
            
            ScrapeAlert::create([
                'job_id' => $log->id,
                'alert_type' => 'scraper_exception',
                'message' => $e->getMessage(),
                'is_resolved' => false
            ]);
            
            $this->error("Scraping failed: " . $e->getMessage());
        }
    }
}