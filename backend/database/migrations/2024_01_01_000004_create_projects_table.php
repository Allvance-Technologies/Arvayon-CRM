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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('set null')->comment('Reference to originating lead');
            $table->text('description')->nullable();
            $table->enum('status', ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'])->default('Planning');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->decimal('estimated_cost', 15, 2)->nullable();
            $table->decimal('actual_cost', 15, 2)->default(0);
            $table->foreignId('project_manager_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('ai_delay_risk', 50)->nullable()->comment('Low, Medium, High');
            $table->text('ai_delay_warning')->nullable();
            $table->timestamp('ai_delay_updated_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('status');
            $table->index('client_id');
            $table->index('project_manager_id');
            $table->index(['start_date', 'end_date']);
            
            // Full-text search index
            // $table->fullText(['name', 'description']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
