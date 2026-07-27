<?php
$dirControllers = __DIR__ . '/app/Http/Controllers/Api/V1/';
$dirMiddleware = __DIR__ . '/app/Http/Middleware/';
$dirCommands = __DIR__ . '/app/Console/Commands/';
$dirServices = __DIR__ . '/app/Services/';

if (!is_dir($dirControllers)) mkdir($dirControllers, 0755, true);
if (!is_dir($dirMiddleware)) mkdir($dirMiddleware, 0755, true);
if (!is_dir($dirCommands)) mkdir($dirCommands, 0755, true);
if (!is_dir($dirServices)) mkdir($dirServices, 0755, true);

// 1. AuthController
$authController = <<<EOT
<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request \$request)
    {
        \$request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        \$user = User::where('email', \$request->email)->first();

        if (!\$user || !Hash::check(\$request->password, \$user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        \$token = \$user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => \$token,
            'token_type' => 'Bearer',
            'user' => \$user
        ]);
    }
    
    public function logout(Request \$request)
    {
        \$request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
EOT;
file_put_contents($dirControllers . 'AuthController.php', $authController);

// 2. AdminMiddleware
$adminMiddleware = <<<EOT
<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request \$request, Closure \$next): Response
    {
        if (!\$request->user() || !in_array(\$request->user()->role, ['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        return \$next(\$request);
    }
}
EOT;
file_put_contents($dirMiddleware . 'AdminMiddleware.php', $adminMiddleware);

// 3. AdminCurationController
$curationController = <<<EOT
<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AgentPatchRating;
use App\Models\AgentMapRating;
use App\Models\StageLabelMapping;
use Illuminate\Support\Facades\DB;

class AdminCurationController extends Controller
{
    public function storePatchRating(Request \$request)
    {
        \$validated = \$request->validate([
            'patch_id' => 'required|uuid',
            'agent' => 'required|string',
            'role' => 'required|string',
            'tier' => 'required|string|in:S,A,B,C,D',
            'direction' => 'required|string|in:buffed,nerfed,unchanged,reworked',
            'notes' => 'nullable|string'
        ]);

        \$rating = AgentPatchRating::create(\$validated);
        return response()->json(\$rating, 201);
    }

    public function storeMapRating(Request \$request)
    {
        \$validated = \$request->validate([
            'patch_id' => 'required|uuid',
            'agent' => 'required|string',
            'map' => 'required|string',
            'score' => 'required|numeric|min:1|max:10',
            'effective_date' => 'nullable|date',
            'source_reference' => 'nullable|string',
            'confidence_level' => 'nullable|string|in:early_speculative,confirmed_by_tournament'
        ]);

        \$rating = AgentMapRating::create(\$validated);
        return response()->json(\$rating, 201);
    }

    public function supersedeMapRating(Request \$request, \$id)
    {
        \$oldRating = AgentMapRating::findOrFail(\$id);
        
        \$validated = \$request->validate([
            'score' => 'required|numeric|min:1|max:10',
            'effective_date' => 'nullable|date',
            'source_reference' => 'nullable|string',
            'confidence_level' => 'nullable|string|in:early_speculative,confirmed_by_tournament'
        ]);
        
        DB::beginTransaction();
        try {
            // Create the new rating preserving patch, agent, map
            \$newRating = AgentMapRating::create([
                'patch_id' => \$oldRating->patch_id,
                'agent' => \$oldRating->agent,
                'map' => \$oldRating->map,
                'score' => \$validated['score'],
                'effective_date' => \$validated['effective_date'] ?? \$oldRating->effective_date,
                'source_reference' => \$validated['source_reference'] ?? \$oldRating->source_reference,
                'confidence_level' => \$validated['confidence_level'] ?? \$oldRating->confidence_level,
            ]);
            
            // Mark the old one as superseded
            \$oldRating->update(['superseded_by_id' => \$newRating->id]);
            
            DB::commit();
            return response()->json(\$newRating, 201);
        } catch (\Exception \$e) {
            DB::rollBack();
            return response()->json(['error' => \$e->getMessage()], 500);
        }
    }
    
    public function storeStageMapping(Request \$request)
    {
        \$validated = \$request->validate([
            'raw_label' => 'required|string|unique:stage_label_mapping,raw_label',
            'normalized_stage' => 'required|string|in:regular_season,playoffs,grand_final',
            'pressure_weight' => 'required|numeric'
        ]);
        
        \$mapping = StageLabelMapping::create(\$validated);
        return response()->json(\$mapping, 201);
    }
}
EOT;
file_put_contents($dirControllers . 'AdminCurationController.php', $curationController);

// 4. ScrapeVlrData Command
$scrapeCommand = <<<EOT
<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ScrapeJobsLog;
use App\Models\ScrapeAlert;
use App\Services\VlrScraperService;

class ScrapeVlrData extends Command
{
    protected \$signature = 'trickster:scrape {source=vlr.gg/matches}';
    protected \$description = 'Run the VLR.gg data scraper pipeline';

    public function handle(VlrScraperService \$scraper)
    {
        \$source = \$this->argument('source');
        \$this->info("Starting scraper for source: {\$source}");
        
        \$log = ScrapeJobsLog::create([
            'source' => \$source,
            'status' => 'success', // Assuming success initially
            'started_at' => now(),
        ]);
        
        try {
            // Scaffold: In the future, this calls actual scraping logic
            \$recordsProcessed = \$scraper->runPipeline(\$source);
            
            \$log->update([
                'status' => 'success',
                'finished_at' => now(),
                'records_processed' => \$recordsProcessed
            ]);
            
            \$this->info("Scraping completed successfully. Records processed: {\$recordsProcessed}");
        } catch (\Exception \$e) {
            \$log->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_message' => \$e->getMessage()
            ]);
            
            ScrapeAlert::create([
                'job_id' => \$log->id,
                'alert_type' => 'scraper_exception',
                'message' => \$e->getMessage(),
                'is_resolved' => false
            ]);
            
            \$this->error("Scraping failed: " . \$e->getMessage());
        }
    }
}
EOT;
file_put_contents($dirCommands . 'ScrapeVlrData.php', $scrapeCommand);

// 5. VlrScraperService
$scraperService = <<<EOT
<?php
namespace App\Services;

class VlrScraperService
{
    /**
     * Scaffold method for the scraper pipeline.
     */
    public function runPipeline(string \$source): int
    {
        // TODO: Implement actual HTTP requests and DOM parsing logic
        // Examples:
        // \$response = Http::get("https://www.vlr.gg/...");
        // \$crawler = new Crawler(\$response->body());
        
        // Simulating processing some records
        sleep(1); 
        return 42; 
    }
}
EOT;
file_put_contents($dirServices . 'VlrScraperService.php', $scraperService);

echo "Admin files generated successfully.\n";
