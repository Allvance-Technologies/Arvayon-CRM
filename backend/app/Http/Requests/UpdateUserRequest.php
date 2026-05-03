<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize()
    {
        return auth()->user()->role === 'Admin';
    }

    public function rules()
    {
        return [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $this->route('user') . '|max:255',
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'sometimes|in:Admin,Sales,Architect,Accounts',
            'is_active' => 'nullable|boolean',
        ];
    }
}
