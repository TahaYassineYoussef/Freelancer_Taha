<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A message can also be a call-log entry (like Messenger's "call ended" card).
     * When these are set the row is a call event rather than a text/attachment.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('call_kind', 10)->nullable()->after('attachment_mime');   // video | voice
            $table->string('call_status', 12)->nullable()->after('call_kind');        // completed | missed | declined
            $table->unsignedInteger('call_seconds')->nullable()->after('call_status');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['call_kind', 'call_status', 'call_seconds']);
        });
    }
};
