<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ephemeral real-time events between two users, delivered by polling and
     * consumed (deleted) once read. Powers the typing indicator and the
     * WebRTC call handshake (offer / answer / ICE / hangup).
     */
    public function up(): void
    {
        Schema::create('signals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('to_id')->constrained('users')->cascadeOnDelete();
            $table->string('kind', 20); // typing, offer, answer, ice, decline, hangup
            $table->longText('payload')->nullable(); // SDP / ICE JSON, etc.
            $table->timestamps();

            $table->index(['to_id', 'from_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signals');
    }
};
