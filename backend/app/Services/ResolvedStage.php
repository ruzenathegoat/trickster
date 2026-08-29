<?php

namespace App\Services;

final readonly class ResolvedStage
{
    public function __construct(
        public ?int $mappingId,
        public string $profile,
        public string $normalizedStage,
        public ?string $phase,
        public ?string $bracket,
        public ?int $roundNumber,
        public bool $isElimination,
        public bool $isQualification,
        public float $qualityWeight,
        public float $evidenceWeight,
        public string $source,
    ) {}
}
