<?php

namespace App\Jobs;

use App\Models\Player;
use App\Services\MetaAdaptabilityService;
use App\Services\PlayerRoleProfileService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CalculateMetaAdaptabilityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** @param array<int, array<string, mixed>|object> $players */
    public function __construct(protected array $players = []) {}

    public function handle(
        PlayerRoleProfileService $roleProfiles,
        MetaAdaptabilityService $metaAdaptability
    ): void {
        if ($this->players === []) {
            Player::query()->select('id')->chunkById(50, function ($players): void {
                self::dispatch($players->map(fn (Player $player): array => ['id' => $player->id])->all())
                    ->onQueue('scrape-default');
            });

            return;
        }

        $playerIds = collect($this->players)
            ->map(function (array|object $player): mixed {
                return is_array($player) ? ($player['id'] ?? null) : ($player->id ?? null);
            })
            ->filter()
            ->values()
            ->all();

        Player::query()->whereIn('id', $playerIds)->each(function (Player $player) use (
            $roleProfiles,
            $metaAdaptability
        ): void {
            $roleProfiles->refresh($player);
            $player->refresh();
            $metaAdaptability->refresh($player);
        });
    }
}
