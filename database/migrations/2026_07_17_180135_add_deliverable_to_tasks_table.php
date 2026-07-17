<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Widen status from the fixed enum to a string so we can add "delivered"
            // (open → in_progress → delivered → completed, or declined).
            // ->change() is database-agnostic (works on MySQL and SQLite tests).
            $table->string('status', 20)->default('open')->change();

            $table->string('deliverable_file')->nullable()->after('status');
            $table->text('deliverable_note')->nullable()->after('deliverable_file');
            $table->timestamp('delivered_at')->nullable()->after('deliverable_note');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['deliverable_file', 'deliverable_note', 'delivered_at']);
        });
    }
};
