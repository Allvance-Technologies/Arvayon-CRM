<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'company_name' => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'industry' => 'nullable|string|max:100',
            'estimated_value' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:New Lead,Initial Contact,Qualification,Tech Call,Site Visit,Proposal,Won,Lost',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'source' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'first_call' => 'nullable|string',
            'second_call' => 'nullable|string',
            'area' => 'nullable|numeric',
            'floors' => 'nullable|integer',
            'complexity' => 'nullable|string',
            'plot_dimensions' => 'nullable|string',
            'architectural_style' => 'nullable|string',
            'site_location_link' => 'nullable|string',
        ];
    }
}
