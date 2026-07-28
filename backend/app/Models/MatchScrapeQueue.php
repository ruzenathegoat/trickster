<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchScrapeQueue extends Model
{
    protected $fillable = [
        'event_id',
        'vlr_match_id',
        'url',
        'status',
        'attempts',
        'error_message'
    ];
}
