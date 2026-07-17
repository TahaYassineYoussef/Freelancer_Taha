<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // For deliverables too big to upload (repos, large archives): a link to
            // GitHub / Google Drive / WeTransfer instead of a hosted file.
            $table->string('deliverable_link')->nullable()->after('deliverable_note');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('deliverable_link');
        });
    }
};
