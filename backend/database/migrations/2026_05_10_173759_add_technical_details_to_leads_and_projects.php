<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('plot_dimensions')->nullable();
            $table->string('architectural_style')->nullable();
            $table->string('site_location_link')->nullable();
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->string('plot_dimensions')->nullable();
            $table->string('architectural_style')->nullable();
            $table->string('site_location_link')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['plot_dimensions', 'architectural_style', 'site_location_link']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['plot_dimensions', 'architectural_style', 'site_location_link']);
        });
    }
};
