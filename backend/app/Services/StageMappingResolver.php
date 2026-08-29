<?php

namespace App\Services;

use App\Models\StageLabelMapping;
use Illuminate\Support\Collection;

final class StageMappingResolver
{
    /** @var array<string, Collection<int, StageLabelMapping>> */
    private array $mappingsByProfile = [];

    public function resolve(string $profileKey, ?string $rawLabel): ResolvedStage
    {
        $rawLabel = trim((string) $rawLabel);
        $mappings = $this->mappings($profileKey);

        foreach ($mappings as $mapping) {
            if (! $this->matches($mapping, $rawLabel)) {
                continue;
            }

            $source = match ($mapping->label_operator) {
                'exact' => 'exact',
                'default' => 'default',
                default => 'pattern',
            };

            return new ResolvedStage(
                mappingId: (int) $mapping->id,
                profile: $profileKey,
                normalizedStage: (string) $mapping->normalized_stage,
                phase: $mapping->phase,
                bracket: $mapping->bracket,
                roundNumber: $mapping->round_number,
                isElimination: (bool) $mapping->is_elimination_match,
                isQualification: (bool) $mapping->is_qualification_match,
                qualityWeight: $this->qualityWeight((float) $mapping->quality_weight),
                evidenceWeight: max(0.0, (float) $mapping->consistency_evidence_weight),
                source: $source,
            );
        }

        return new ResolvedStage(
            mappingId: null,
            profile: $profileKey,
            normalizedStage: 'unmapped',
            phase: null,
            bracket: null,
            roundNumber: null,
            isElimination: false,
            isQualification: false,
            qualityWeight: 1.0,
            evidenceWeight: 0.0,
            source: 'unmapped',
        );
    }

    public function matches(StageLabelMapping $mapping, ?string $rawLabel): bool
    {
        $rawLabel = trim((string) $rawLabel);

        return match ($mapping->label_operator) {
            'exact' => $this->canonicalize($rawLabel)
                === ($mapping->canonical_label ?: $this->canonicalize((string) $mapping->raw_label)),
            'contains' => str_contains(
                $this->canonicalize($rawLabel),
                $this->canonicalize((string) $mapping->raw_label)
            ),
            'regex' => $this->matchesRegex((string) $mapping->raw_label, $rawLabel),
            'default' => true,
            default => false,
        };
    }

    public function canonicalize(?string $label): string
    {
        return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', (string) $label)));
    }

    public function forgetCachedMappings(): void
    {
        $this->mappingsByProfile = [];
    }

    private function mappings(string $profileKey): Collection
    {
        if (! isset($this->mappingsByProfile[$profileKey])) {
            $this->mappingsByProfile[$profileKey] = StageLabelMapping::query()
                ->whereHas('profile', fn ($query) => $query->where('key', $profileKey)->where('is_active', true))
                ->where('is_active', true)
                ->orderByDesc('priority')
                ->orderBy('id')
                ->get();
        }

        return $this->mappingsByProfile[$profileKey];
    }

    private function qualityWeight(float $weight): float
    {
        return max(0.90, min(1.15, $weight));
    }

    private function matchesRegex(string $pattern, string $rawLabel): bool
    {
        $delimiter = '~';
        $safePattern = str_replace($delimiter, '\\'.$delimiter, $pattern);

        return @preg_match($delimiter.$safePattern.$delimiter.'iu', $rawLabel) === 1;
    }
}
