<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->enum('feedback_type', ['lead_score', 'proposal', 'delay_prediction']);
            $table->string('subject_type', 100);
            $table->unsignedBigInteger('subject_id');
            $table->integer('rating')->nullable()->comment('1-5 rating or thumbs up/down');
            $table->text('prediction_value')->nullable()->comment('The AI prediction that was made');
            $table->text('actual_outcome')->nullable()->comment('The actual result for training');
            $table->decimal('confidence_score', 5, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at');
            
            $table->index('feedback_type');
            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_feedback');
    }
};
