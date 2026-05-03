<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Payroll;
use App\Models\User;
use App\Models\Attendance;
use Carbon\Carbon;

class PayrollController extends Controller
{
    public function index()
    {
        return Payroll::with('user')->orderBy('created_at', 'desc')->get();
    }

    public function generateMonthly(Request $request)
    {
        $month = Carbon::now()->startOfMonth();
        $billingCycle = $month->format('F Y');
        
        $users = User::with('employeeProfile')->get();
        $payrollsGenerated = 0;

        foreach ($users as $user) {
            if (!$user->employeeProfile) continue;

            $baseSalary = $user->employeeProfile->base_salary;
            
            $attendances = Attendance::where('user_id', $user->id)
                ->whereMonth('date', $month->month)
                ->whereYear('date', $month->year)
                ->get();

            // Calculate days present in the current month
            $daysPresent = $attendances->where('status', 'Present')->count();

            // Calculate total overtime hours
            $totalOvertimeHours = $attendances->sum('overtime_hours');
                
            $totalWorkingDays = 22; // Assuming 22 working days
            $dailyRate = $totalWorkingDays > 0 ? ($baseSalary / $totalWorkingDays) : 0;
            $hourlyRate = $dailyRate / 8; // Assuming 8-hour workday
            
            // Overtime Pay Calculation
            $overtimePay = $totalOvertimeHours * $hourlyRate;

            $daysAbsentOrLeave = max(0, $totalWorkingDays - $daysPresent);
            $leaveDeductions = $daysAbsentOrLeave * $dailyRate;
            
            $netPayable = max(0, $baseSalary - $leaveDeductions + $overtimePay);

            Payroll::updateOrCreate(
                ['user_id' => $user->id, 'billing_cycle' => $billingCycle],
                [
                    'base_salary' => $baseSalary,
                    'days_present' => $daysPresent,
                    'leave_deductions' => $leaveDeductions,
                    'overtime_pay' => $overtimePay,
                    'net_payable' => $netPayable,
                    'status' => 'Pending'
                ]
            );
            $payrollsGenerated++;
        }

        return response()->json(['message' => "$payrollsGenerated payrolls generated for $billingCycle."]);
    }
}
