<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Where the freelancer receives PayPal money. The client ID is public
            // (it is sent to the browser to render the PayPal button).
            $table->string('paypal_email')->nullable()->after('d17_qr');
            $table->string('paypal_client_id', 500)->nullable()->after('paypal_email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['paypal_email', 'paypal_client_id']);
        });
    }
};
