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
            $table->string('lead_custom_id')->nullable()->unique()->after('id');
            $table->string('location')->nullable()->after('industry');
            $table->text('first_call')->nullable()->after('notes');
            $table->text('second_call')->nullable()->after('first_call');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->string('project_custom_id')->nullable()->unique()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['lead_custom_id', 'location', 'first_call', 'second_call']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['project_custom_id']);
        });
    }
};
