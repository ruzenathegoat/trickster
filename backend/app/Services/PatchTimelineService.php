<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class PatchTimelineService
{
    /**
     * Fill missing patch metadata with the latest patch released on or before
     * the match date. Explicit match patch IDs always take precedence.
     *
     * @param  array<int, array<string, mixed>>  $observations
     * @return array<int, array<string, mixed>>
     */
    public function infer(array $observations): array
    {
        if (! collect($observations)->contains(fn (array $row): bool => empty($row['patch_id']))) {
            return $observations;
        }

        $patches = DB::table('patches')
            ->whereNotNull('release_date')
            ->orderBy('release_date')
            ->get(['id', 'version', 'release_date'])
            ->map(fn (object $patch): array => [
                'id' => (string) $patch->id,
                'version' => (string) $patch->version,
                'release_date' => (string) $patch->release_date,
            ])
            ->all();

        if ($patches === []) {
            return $observations;
        }

        foreach ($observations as &$observation) {
            if (! empty($observation['patch_id']) || empty($observation['match_date'])) {
                continue;
            }

            $matchDate = CarbonImmutable::parse((string) $observation['match_date'])->toDateString();
            $resolved = null;
            foreach ($patches as $patch) {
                if ($patch['release_date'] > $matchDate) {
                    break;
                }
                $resolved = $patch;
            }

            if ($resolved !== null) {
                $observation['patch_id'] = $resolved['id'];
                $observation['patch_version'] = $resolved['version'];
                $observation['release_date'] = $resolved['release_date'];
                $observation['patch_source'] = 'release_date_inferred';
            }
        }
        unset($observation);

        return $observations;
    }
}
