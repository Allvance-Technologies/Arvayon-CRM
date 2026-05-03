<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'estimated_cost' => $this->estimated_cost,
            'actual_cost' => $this->actual_cost,
            'ai_delay_risk' => $this->ai_delay_risk,
            'ai_delay_warning' => $this->ai_delay_warning,
            'ai_delay_updated_at' => $this->ai_delay_updated_at,
            'client' => $this->client ? [
                'id' => $this->client->id,
                'company_name' => $this->client->company_name,
            ] : null,
            'project_manager' => $this->projectManager ? [
                'id' => $this->projectManager->id,
                'name' => $this->projectManager->name,
            ] : null,
            'architect' => $this->architect ? [
                'id' => $this->architect->id,
                'name' => $this->architect->name,
            ] : null,
            'milestones_count' => $this->whenCounted('milestones'),
            'tasks_count' => $this->whenCounted('tasks'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
