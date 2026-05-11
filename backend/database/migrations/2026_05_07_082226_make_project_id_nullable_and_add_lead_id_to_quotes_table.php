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
        Schema::table('quotes', function (Blueprint $table) {
            $table->unsignedBigInteger('project_id')->nullable()->change();
            $table->foreignId('lead_id')->nullable()->after('project_id')->constrained('leads')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            // SQLite cannot drop foreign keys or alter columns easily without recreate
        });
    }
};
