<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_logs', function (Blueprint $table) {
            $table->id();
            // Null when a logged-out visitor was blocked (e.g. the contact form).
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('context')->nullable();   // what they were submitting
            $table->string('field')->nullable();     // which field was blocked
            $table->string('category');              // profanity | scam | spam | ...
            $table->string('reason');                // why it was blocked
            $table->string('detected_by');           // 'word_list' or 'ai'
            $table->text('content');                 // what they actually tried to post
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_logs');
    }
};
