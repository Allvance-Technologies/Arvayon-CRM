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
            $table->decimal('area', 10, 2)->nullable();
            $table->integer('floors')->nullable();
            $table->string('complexity')->nullable();
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->decimal('area', 10, 2)->nullable();
            $table->integer('floors')->nullable();
            $table->string('complexity')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['area', 'floors', 'complexity']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['area', 'floors', 'complexity']);
        });
    }
};
