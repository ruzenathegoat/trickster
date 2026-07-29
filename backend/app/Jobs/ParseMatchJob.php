<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\MatchScrapeQueue;
use App\Models\Player;

class ParseMatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $queueItem;
    public $fileName;

    public function __construct(MatchScrapeQueue $queueItem, string $fileName)
    {
        $this->queueItem = $queueItem;
        $this->fileName = $fileName;
    }

    public function handle(): void
    {
        if (!Storage::exists($this->fileName)) {
            $this->queueItem->update(["status" => "failed", "error_message" => "HTML file missing for parsing"]);
            return;
        }

        try {
            $html = Storage::get($this->fileName);
            $crawler = new Crawler($html);
            
            $players = [];
            
            // Extract Players
            $crawler->filter(".mod-player")->each(function (Crawler $node) use (&$players) {
                $a = $node->filter("a");
                if ($a->count() > 0) {
                    $href = $a->attr("href");
                    $parts = explode("/", $href);
                    $id = $parts[2] ?? null;
                    $name = trim($a->filter(".text-of")->text(""));
                    
                    if ($id && $name) {
                        $player = Player::updateOrCreate(
                            ["vlr_player_id" => $id],
                            ["ign" => $name, "name" => $name]
                        );
                        $players[] = $player;
                    }
                }
            });

            // Delete temporary HTML
            Storage::delete($this->fileName);
            $this->queueItem->update(["status" => "completed"]);

            // Dispatch CalculateMetricJob
            CalculateMetricJob::dispatch($this->queueItem->vlr_match_id, $players);

        } catch (\Exception $e) {
            $this->queueItem->update(["status" => "failed", "error_message" => "Parsing failed: " . $e->getMessage()]);
            throw $e;
        }
    }
}

