<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lets the freelancer show/hide the PayPal button for clients straight from
     * Payment Settings, without touching .env — the credentials stay saved
     * either way, so it can be switched back on at any time.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('paypal_enabled')->default(true)->after('paypal_client_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('paypal_enabled');
        });
    }
};
