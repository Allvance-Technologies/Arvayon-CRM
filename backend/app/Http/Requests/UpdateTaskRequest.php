<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'sometimes|exists:projects,id',
            'milestone_id' => 'nullable|exists:milestones,id',
            'assigned_to' => 'sometimes|exists:users,id',
            'status' => 'sometimes|in:Pending,In Progress,Completed,Cancelled',
            'priority' => 'nullable|in:Low,Medium,High,Urgent',
            'due_date' => 'nullable|date',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
        ];
    }
}
