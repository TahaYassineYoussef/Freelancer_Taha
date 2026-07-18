<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DateAvailability extends Model
{
    protected $table = 'availability_dates';

    protected $fillable = [
        'user_id', 'date', 'is_open', 'start_time', 'end_time',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
