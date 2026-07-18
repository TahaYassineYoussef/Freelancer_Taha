<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = [
        'sender_id', 'receiver_id', 'body', 'read_at',
        'attachment_path', 'attachment_name', 'attachment_mime',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    /**
     * Public URL of the attachment, or null. Appended to array output so the
     * front-end can render it without extra queries.
     */
    public function attachmentUrl(): ?string
    {
        return $this->attachment_path
            ? \Illuminate\Support\Facades\Storage::url($this->attachment_path)
            : null;
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
