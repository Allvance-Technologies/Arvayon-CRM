<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'company_name' => 'required|string|max:255',
            'contact_person' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:leads,email',
            'phone' => 'nullable|string|max:50|unique:leads,phone',
            'industry' => 'nullable|string|max:100',
            'estimated_value' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:New Lead,Initial Contact,Qualification,Tech Call,Site Visit,Proposal,Won,Lost',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'source' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'first_call' => 'nullable|string',
            'second_call' => 'nullable|string',
        ];
    }
}
