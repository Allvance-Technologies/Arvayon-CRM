<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmployeeProfile;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        // employees are users who have an EmployeeProfile or we can fetch all users WITH employeeProfile.
        // Since we are managing full profiles, let's fetch users along with their employeeProfile
        $query = User::with('employeeProfile');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('employeeProfile', function ($q2) use ($search) {
                      $q2->where('designation', 'like', "%{$search}%")
                         ->orWhere('department', 'like', "%{$search}%");
                  });
            });
        }

        $employees = $query->paginate(15);
        
        return response()->json($employees);
    }

    public function show($id)
    {
        $employee = User::with('employeeProfile')->findOrFail($id);
        return response()->json($employee);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'is_active' => 'boolean',
            
            // Profile fields
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'join_date' => 'nullable|date',
            'status' => 'nullable|string',
            'linkedin' => 'nullable|string|url',
            'instagram' => 'nullable|string|url',
            'whatsapp' => 'nullable|string',
            'facebook' => 'nullable|string|url',
            'website' => 'nullable|string|url',
        ]);

        try {
            DB::beginTransaction();

            $username = explode('@', $validated['email'])[0] . '_' . rand(100, 999);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'username' => $username,
                'password' => bcrypt($validated['password']),
                'role' => $validated['role'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $user->employeeProfile()->create([
                'designation' => $validated['designation'] ?? null,
                'department' => $validated['department'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'join_date' => $validated['join_date'] ?? null,
                'status' => $validated['status'] ?? 'Active',
                'linkedin' => $validated['linkedin'] ?? null,
                'instagram' => $validated['instagram'] ?? null,
                'whatsapp' => $validated['whatsapp'] ?? null,
                'facebook' => $validated['facebook'] ?? null,
                'website' => $validated['website'] ?? null,
            ]);

            DB::commit();

            return response()->json($user->load('employeeProfile'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create employee', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|string',
            'is_active' => 'boolean',
            
            // Profile fields
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'join_date' => 'nullable|date',
            'status' => 'nullable|string',
            'linkedin' => 'nullable|string|url',
            'instagram' => 'nullable|string|url',
            'whatsapp' => 'nullable|string',
            'facebook' => 'nullable|string|url',
            'website' => 'nullable|string|url',
        ]);

        try {
            DB::beginTransaction();

            if (isset($validated['password'])) {
                $validated['password'] = bcrypt($validated['password']);
            }

            $userData = collect($validated)->only(['name', 'email', 'password', 'role', 'is_active'])->toArray();
            if(!empty($userData)){
                $user->update($userData);
            }
            
            $profileData = collect($validated)->only([
                'designation', 'department', 'phone', 'address', 'join_date', 'status',
                'linkedin', 'instagram', 'whatsapp', 'facebook', 'website'
            ])->toArray();

            if ($user->employeeProfile) {
                $user->employeeProfile->update($profileData);
            } else {
                $user->employeeProfile()->create($profileData);
            }

            DB::commit();

            return response()->json($user->load('employeeProfile'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update employee', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete(); // This will soft delete User and optionally cascade depending on DB constraints, 
                        // but generally we want to soft delete the user so they can't log in
        return response()->json(null, 204);
    }
    
    public function tasks($id)
    {
        // Get tasks assigned to this user
        $tasks = Task::with(['project', 'assignedTo'])
                    ->where('assigned_to', $id)
                    ->orderBy('due_date', 'asc')
                    ->paginate(10);
                    
        return response()->json($tasks);
    }
}
