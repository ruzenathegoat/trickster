<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ScrapeJobsLog extends Model
{
    use HasUuids;
    protected $table = 'scrape_jobs_log';
    public $timestamps = false;
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['id', 'source', 'status', 'started_at', 'finished_at', 'error_message', 'records_processed'];
}
