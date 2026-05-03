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
        Schema::table('proposals', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('lead_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('quote_id')->nullable()->after('project_id')->constrained('quotes')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['quote_id']);
            $table->dropColumn(['project_id', 'quote_id']);
        });
    }
};
