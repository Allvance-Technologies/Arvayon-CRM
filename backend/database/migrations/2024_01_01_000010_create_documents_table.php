<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('name');
            $table->string('file_path', 500)->comment('S3 key');
            $table->bigInteger('file_size')->comment('Size in bytes');
            $table->string('mime_type', 100);
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('restrict');
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();
            
            $table->index('project_id');
            $table->index('is_deleted');
            
            // $table->fullText(['name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
