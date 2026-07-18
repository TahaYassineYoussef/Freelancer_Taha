<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-date availability overrides. These win over the weekly pattern for one
     * specific calendar day — the freelancer can open an extra day, change its
     * hours, or mark a normally-open day as off.
     */
    public function up(): void
    {
        Schema::create('availability_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->boolean('is_open')->default(true);
            $table->string('start_time', 5)->default('09:00');
            $table->string('end_time', 5)->default('17:00');
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availability_dates');
    }
};
