<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A client requests a call/consultation in one of the freelancer's free slots.
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // the client
            $table->dateTime('starts_at');
            $table->unsignedSmallInteger('duration_min')->default(60);
            $table->string('topic');
            $table->text('note')->nullable();
            $table->string('status', 20)->default('pending'); // pending, confirmed, declined, cancelled
            $table->timestamps();

            $table->index(['starts_at', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
