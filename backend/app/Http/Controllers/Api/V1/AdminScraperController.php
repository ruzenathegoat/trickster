<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ScrapeJobsLog;
use App\Models\MatchScrapeQueue;
use App\Models\ScrapeAlert;
use Illuminate\Http\Request;

class AdminScraperController extends Controller
{
    public function fetchEvents()
    {
        // Dispatch the fetching to a background worker to avoid blocking the frontend
        \App\Jobs\SyncVlrEventsJob::dispatch()->onQueue('scrape-high');

        return response()->json([
            "message" => "Sync task dispatched to background. Check the dashboard shortly.",
            "records_processed" => 0
        ]);
    }

    public function processQueue()
    {
        // Now queue processing is handled by actual Laravel Queue Workers (php artisan queue:work).
        // This endpoint can just return a success message or be removed entirely.
        // We'll leave it to return a simple message for backward compatibility in frontend.
        return response()->json([
            "message" => "Background workers are active and will process the queue automatically.",
            "records_processed" => 0
        ]);
    }

    public function getLogs()
    {
        $logs = ScrapeJobsLog::orderBy("started_at", "desc")->take(20)->get();
        return response()->json($logs);
    }
    
    public function getAlerts()
    {
        $alerts = ScrapeAlert::with("job")->orderBy("created_at", "desc")->take(20)->get();
        return response()->json($alerts);
    }

    public function getQueueStats()
    {
        $stats = [
            "pending" => MatchScrapeQueue::where("status", "pending")->count(),
            "processing" => MatchScrapeQueue::where("status", "processing")->count(),
            "completed" => MatchScrapeQueue::where("status", "completed")->count(),
            "failed" => MatchScrapeQueue::where("status", "failed")->count(),
            "total" => MatchScrapeQueue::count()
        ];
        
        return response()->json($stats);
    }
}
