<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StageLabelMapping extends Model
{
    protected $table = 'stage_label_mapping';
    public $timestamps = false;
    protected $fillable = ['raw_label', 'normalized_stage', 'pressure_weight'];
}
