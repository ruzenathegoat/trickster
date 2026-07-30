<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScrapeJobsLog extends Model
{
    protected $table = 'scrape_jobs_log';
    public $timestamps = false;
    protected $fillable = ['source', 'status', 'started_at', 'finished_at', 'error_message', 'records_processed'];
}
