<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'user_id', 'starts_at', 'duration_min', 'topic', 'note', 'status',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'duration_min' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function endsAt(): \Illuminate\Support\Carbon
    {
        return $this->starts_at->copy()->addMinutes($this->duration_min);
    }
}
