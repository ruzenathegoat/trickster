<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StageLabelMapping extends Model
{
    use HasUuids;
    protected $table = 'stage_label_mapping';
    public $timestamps = false;
    protected $fillable = ['raw_label', 'normalized_stage', 'pressure_weight'];
}
