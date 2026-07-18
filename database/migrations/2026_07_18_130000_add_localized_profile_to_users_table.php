<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * French & Arabic versions of the public headline and bio, so the home page
     * shows the right language. The existing `headline`/`bio` remain the English
     * (and default) copy; these override it when the visitor picks fr/ar.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('headline_fr')->nullable()->after('headline');
            $table->string('headline_ar')->nullable()->after('headline_fr');
            $table->text('bio_fr')->nullable()->after('bio');
            $table->text('bio_ar')->nullable()->after('bio_fr');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['headline_fr', 'headline_ar', 'bio_fr', 'bio_ar']);
        });
    }
};
