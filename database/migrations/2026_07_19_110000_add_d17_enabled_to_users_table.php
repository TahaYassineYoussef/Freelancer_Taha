<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Same show/hide switch as PayPal, for the D17 (DigiPost) button. The wallet
     * number and QR stay saved while it is hidden.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('d17_enabled')->default(true)->after('d17_qr');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('d17_enabled');
        });
    }
};
