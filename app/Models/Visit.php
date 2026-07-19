<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visit extends Model
{
    protected $fillable = [
        'visitor_id', 'is_new', 'path', 'referrer', 'device', 'browser', 'language', 'ip_hash', 'user_id',
    ];

    protected $casts = [
        'is_new' => 'boolean',
    ];
}
