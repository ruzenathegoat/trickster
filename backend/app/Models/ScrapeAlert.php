<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScrapeAlert extends Model
{
    use HasUuids;

    protected $fillable = ['job_id', 'alert_type', 'message', 'is_resolved'];

    public function job(): BelongsTo
    {
        return $this->belongsTo(ScrapeJobsLog::class, 'job_id');
    }
}
