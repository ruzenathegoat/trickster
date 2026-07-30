<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchScrapeQueue extends Model
{
    protected $fillable = [
        'vlr_event_id',
        'vlr_match_id',
        'url',
        'status',
        'attempts',
        'error_message'
    ];
}
