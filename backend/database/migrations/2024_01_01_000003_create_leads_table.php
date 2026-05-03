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
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('contact_person');
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('source', 100)->nullable();
            $table->string('industry', 100)->nullable();
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->enum('status', [
                'New Lead',
                'Initial Contact',
                'Qualification',
                'Tech Call',
                'Site Visit',
                'Proposal',
                'Won',
                'Lost'
            ])->default('New Lead');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('ai_score', 5, 2)->nullable()->comment('AI-generated conversion probability (0-100)');
            $table->timestamp('ai_score_updated_at')->nullable();
            $table->text('notes')->nullable();
            $table->text('lost_reason')->nullable();
            $table->date('won_date')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
            
            // Indexes
            $table->index('status');
            $table->index('assigned_to');
            $table->index('created_at');
            $table->index('ai_score');
            
            // Full-text search index
            // $table->fullText(['company_name', 'contact_person', 'notes']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
