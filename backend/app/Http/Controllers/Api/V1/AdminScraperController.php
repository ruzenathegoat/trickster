<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\VlrScraperService;
use App\Models\ScrapeJobsLog;
use Illuminate\Http\Request;

class AdminScraperController extends Controller
{
    protected VlrScraperService $scraper;

    public function __construct(VlrScraperService $scraper)
    {
        $this->scraper = $scraper;
    }

    public function runScraper(Request $request)
    {
        // In a real app this would be dispatched to a Queue (e.g. php artisan queue:work).
        // For the MVP, we execute synchronously.
        $source = $request->input('source', '/events');
        $records = $this->scraper->runPipeline($source);

        return response()->json([
            'message' => 'Scraper pipeline finished.',
            'records_processed' => $records
        ]);
    }

    public function getLogs()
    {
        $logs = ScrapeJobsLog::orderBy('started_at', 'desc')->take(20)->get();
        return response()->json($logs);
    }

    public function getAlerts()
    {
        $alerts = \App\Models\ScrapeAlert::with('job')->orderBy('created_at', 'desc')->take(20)->get();
        return response()->json($alerts);
    }
}
