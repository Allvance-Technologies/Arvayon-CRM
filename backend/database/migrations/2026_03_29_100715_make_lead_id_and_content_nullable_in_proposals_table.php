<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For SQLite, we cannot easily modify columns with foreign keys using ->change().
        // Since the count of proposals is 0 (verified), we can drop and recreate the table with correct types.
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('proposals');
        
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('cascade');
            $table->foreignId('quote_id')->nullable()->constrained('quotes')->nullOnDelete();
            
            $table->string('title');
            $table->string('client_name')->nullable();
            $table->string('project_location')->nullable();
            $table->string('project_area')->nullable();
            
            $table->text('content')->nullable();
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->enum('status', ['Draft', 'Sent', 'Accepted', 'Rejected'])->default('Draft');
            $table->boolean('ai_generated')->default(false);
            $table->date('sent_date')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            
            $table->timestamps();
            
            $table->index('lead_id');
            $table->index('project_id');
            $table->index('status');
        });
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting this is complex for SQLite, we'd have to restore the old migrations state.
        // For a dev fix, we'll just leave it or recreate the basic state.
    }
};
