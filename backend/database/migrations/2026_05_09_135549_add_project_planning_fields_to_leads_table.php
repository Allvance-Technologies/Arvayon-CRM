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
            $table->date('start_date')->nullable()->after('won_date');
            $table->date('end_date')->nullable()->after('start_date');
            $table->foreignId('project_manager_id')->nullable()->constrained('users')->onDelete('set null')->after('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['project_manager_id']);
            $table->dropColumn(['start_date', 'end_date', 'project_manager_id']);
        });
    }
};
