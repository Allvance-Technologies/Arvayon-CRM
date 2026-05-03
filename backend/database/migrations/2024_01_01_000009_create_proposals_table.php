<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->string('title');
            $table->text('content');
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->enum('status', ['Draft', 'Sent', 'Accepted', 'Rejected'])->default('Draft');
            $table->boolean('ai_generated')->default(false);
            $table->date('sent_date')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
            
            $table->index('lead_id');
            $table->index('status');
            $table->index('ai_generated');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};
