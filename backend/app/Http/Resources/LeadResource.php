<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'company_name' => $this->company_name,
            'contact_person' => $this->contact_person,
            'email' => $this->email,
            'phone' => $this->phone,
            'industry' => $this->industry,
            'estimated_value' => $this->estimated_value,
            'status' => $this->status,
            'source' => $this->source,
            'notes' => $this->notes,
            'ai_score' => $this->ai_score,
            'ai_score_updated_at' => $this->ai_score_updated_at,
            'location' => $this->location,
            'lead_custom_id' => $this->lead_custom_id,
            'first_call' => $this->first_call,
            'second_call' => $this->second_call,
            'assigned_to' => $this->assignedUser ? [
                'id' => $this->assignedUser->id,
                'name' => $this->assignedUser->name,
            ] : null,
            'created_by' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
