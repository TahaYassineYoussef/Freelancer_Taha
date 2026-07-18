<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Signal extends Model
{
    protected $fillable = [
        'from_id', 'to_id', 'kind', 'payload',
    ];
}
