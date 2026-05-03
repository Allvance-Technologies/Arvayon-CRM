<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Attendance;

class AttendanceController extends Controller
{
    public function index()
    {
        return Attendance::with('user')->orderBy('date', 'desc')->get();
    }

    public function myRecords(Request $request)
    {
        return Attendance::where('user_id', $request->user()->id)
            ->orderBy('date', 'desc')
            ->get();
    }

    public function clockIn(Request $request)
    {
        $today = now()->format('Y-m-d');
        $attendance = Attendance::firstOrCreate(
            ['user_id' => $request->user()->id, 'date' => $today],
            ['clock_in_time' => now(), 'status' => 'Present']
        );

        if ($attendance->wasRecentlyCreated) {
            return response()->json(['message' => 'Clocked in successfully', 'data' => $attendance]);
        }

        return response()->json(['message' => 'Already clocked in today', 'data' => $attendance], 400);
    }

    public function clockOut(Request $request)
    {
        $today = now()->format('Y-m-d');
        $attendance = Attendance::where('user_id', $request->user()->id)->where('date', $today)->first();

        if (!$attendance) {
            return response()->json(['message' => 'No clock-in record found for today'], 400);
        }

        $attendance->update(['clock_out_time' => now()]);

        return response()->json(['message' => 'Clocked out successfully', 'data' => $attendance]);
    }

    public function update(Request $request, Attendance $attendance)
    {
        $request->validate([
            'status' => 'sometimes|string',
            'leave_type' => 'nullable|string',
            'overtime_hours' => 'sometimes|numeric|min:0'
        ]);

        $attendance->update($request->only(['status', 'leave_type', 'overtime_hours']));

        return response()->json(['message' => 'Attendance updated successfully', 'data' => $attendance]);
    }
}
