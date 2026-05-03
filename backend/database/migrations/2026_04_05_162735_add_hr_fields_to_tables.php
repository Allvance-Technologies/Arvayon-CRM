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
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('leave_type')->nullable()->after('status');
            $table->decimal('overtime_hours', 5, 2)->default(0)->after('leave_type');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('overtime_pay', 10, 2)->default(0)->after('base_salary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['leave_type', 'overtime_hours']);
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn('overtime_pay');
        });
    }
};
