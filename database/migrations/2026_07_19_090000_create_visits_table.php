<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per public page view. Visitors are identified by an anonymous
     * first-party cookie token — no personal data is stored, and the IP is only
     * kept as a one-way hash, so this stays privacy-friendly (no consent banner).
     */
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->string('visitor_id', 40);           // anonymous cookie token
            $table->boolean('is_new')->default(false);  // first ever visit for this token
            $table->string('path');
            $table->string('referrer')->nullable();     // host only, e.g. "google.com"
            $table->string('device', 10)->default('desktop');
            $table->string('browser', 20)->default('Other');
            $table->string('language', 5)->nullable();
            $table->string('ip_hash', 64)->nullable();  // sha256, never the raw IP
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('visitor_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
