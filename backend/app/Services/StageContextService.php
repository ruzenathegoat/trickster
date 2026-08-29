<?php

namespace App\Services;

use App\Models\StageFormatProfile;
use Illuminate\Support\Facades\DB;

final class StageContextService
{
    public function __construct(private readonly StageMappingResolver $resolver) {}

    /** @return array<string, mixed> */
    public function prepareSeason(int $season): array
    {
        $events = DB::table('events as e')
            ->join('matches as m', 'm.event_id', '=', 'e.id')
            ->leftJoin('stage_format_profiles as sfp', 'sfp.id', '=', 'e.stage_format_profile_id')
            ->whereYear('m.match_date', $season)
            ->select([
                'e.id',
                'e.name',
                'e.season',
                'e.stage_format_profile_id',
                'e.stage_profile_source',
                'sfp.key as current_profile_key',
            ])
            ->distinct()
            ->get();

        $classified = 0;
        foreach ($events as $event) {
            $level = CompetitionQualityConfig::classifyEvent((string) $event->name);
            $base = CompetitionQualityConfig::eventBase($level);
            $profile = null;

            if ($event->stage_profile_source === 'admin' && $event->stage_format_profile_id !== null) {
                $profile = StageFormatProfile::query()->find($event->stage_format_profile_id);
            }
            if ($profile === null && $level !== null) {
                $profile = $this->profileFor($level, $season);
            }

            DB::table('events')->where('id', $event->id)->update([
                'season' => $event->season ?: (string) $season,
                'competition_level' => $level,
                'competition_base_weight' => $base,
                'stage_format_profile_id' => $profile?->id,
                'stage_profile_source' => $event->stage_profile_source === 'admin' ? 'admin' : 'auto',
                'stage_profile_resolved_at' => now(),
            ]);

            if ($level !== null) {
                $classified++;
            }
        }

        $matches = DB::table('matches as m')
            ->join('events as e', 'e.id', '=', 'm.event_id')
            ->leftJoin('stage_format_profiles as sfp', 'sfp.id', '=', 'e.stage_format_profile_id')
            ->whereYear('m.match_date', $season)
            ->select('m.id', 'm.raw_stage_label', 'sfp.key as profile_key')
            ->get();

        $counts = ['exact' => 0, 'pattern' => 0, 'default' => 0, 'unmapped' => 0];
        $profileCounts = [];
        $updates = [];
        foreach ($matches as $match) {
            $profileKey = $match->profile_key === null ? null : (string) $match->profile_key;
            if ($profileKey === null) {
                $resolved = null;
                $source = 'unmapped';
            } else {
                $resolved = $this->resolver->resolve($profileKey, $match->raw_stage_label);
                $source = $resolved->source;
                $profileCounts[$profileKey] = ($profileCounts[$profileKey] ?? 0) + 1;
            }

            $counts[$source]++;
            $updates[] = [
                'id' => $match->id,
                'stage_label_id' => $resolved?->mappingId,
                'stage_resolution_source' => $source,
            ];
        }

        $this->bulkUpdateMatches($updates);

        return [
            'season' => $season,
            'events' => count($events),
            'classified_events' => $classified,
            'matches' => count($updates),
            'resolution' => $counts,
            'profiles' => $profileCounts,
        ];
    }

    private function profileFor(string $competitionLevel, int $season): ?StageFormatProfile
    {
        return StageFormatProfile::query()
            ->where('competition_level', $competitionLevel)
            ->where('is_active', true)
            ->where('valid_from_season', '<=', $season)
            ->where(function ($query) use ($season): void {
                $query->whereNull('valid_to_season')->orWhere('valid_to_season', '>=', $season);
            })
            ->orderByDesc('valid_from_season')
            ->first();
    }

    /** @param array<int, array<string, mixed>> $updates */
    private function bulkUpdateMatches(array $updates): void
    {
        foreach (array_chunk($updates, 200) as $chunk) {
            $mappingCases = [];
            $sourceCases = [];
            $mappingBindings = [];
            $sourceBindings = [];
            $ids = [];

            foreach ($chunk as $row) {
                $mappingCases[] = 'WHEN id = ? THEN ?';
                $mappingBindings[] = $row['id'];
                $mappingBindings[] = $row['stage_label_id'];
                $sourceCases[] = 'WHEN id = ? THEN ?';
                $sourceBindings[] = $row['id'];
                $sourceBindings[] = $row['stage_resolution_source'];
                $ids[] = $row['id'];
            }

            $placeholders = implode(', ', array_fill(0, count($ids), '?'));
            DB::update(
                'UPDATE matches SET stage_label_id = CASE '.implode(' ', $mappingCases).
                ' ELSE stage_label_id END, stage_resolution_source = CASE '.implode(' ', $sourceCases).
                ' ELSE stage_resolution_source END, stage_resolved_at = ? WHERE id IN ('.$placeholders.')',
                array_merge($mappingBindings, $sourceBindings, [now()], $ids)
            );
        }
    }
}
