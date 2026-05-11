<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\Project;
use App\Models\Milestone;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class ProjectGeneratorService
{
    public function generateFromLead(Lead $lead, Project $project): void
    {
        $firstCall = is_string($lead->first_call) ? json_decode($lead->first_call, true) : $lead->first_call;
        if (!is_array($firstCall)) $firstCall = ['raw' => $lead->first_call];

        $secondCall = is_string($lead->second_call) ? json_decode($lead->second_call, true) : $lead->second_call;
        if (!is_array($secondCall)) $secondCall = ['raw' => $lead->second_call];

        $type = $firstCall['primary_service'] ?? 'Architectural Design';
        // if type was plain text, maybe try to regex it from raw?
        if ($type === 'Architectural Design' && !empty($firstCall['raw'])) {
            $type = $firstCall['raw'];
        }
        $internal_type = $this->mapServiceToType($type);
        
        $complexity = strtolower($lead->complexity ?: ($firstCall['consultancy_plan'] ?? 'standard'));
        if (!in_array($complexity, ['basic', 'standard', 'premium'])) {
            $complexity = 'standard';
        }

        $area = intval($lead->area ?: ($firstCall['unit_quantity'] ?? 0));
        if ($area <= 0 && preg_match('/(\d+)\s*sq\s*ft/i', $firstCall['raw'] ?? '', $m)) {
            $area = intval($m[1]);
        }
        if ($area <= 0) $area = 2000;

        $floors = intval($lead->floors ?: 1);
        $notes = ($lead->notes ?? '') . ' ' . ($secondCall['requirements'] ?? '');
        if ($floors <= 1 && preg_match('/(\d+)\s*(floor|storey)/i', $notes, $m)) {
            $floors = intval($m[1]);
        }
        if ($floors <= 0) $floors = 1;

        // Auto-assign project manager if not set
        if (!$project->project_manager_id) {
            $project->project_manager_id = $this->getBestManagerId();
        }

        // Calculate estimated cost if not set or zero
        if (!$project->estimated_cost || $project->estimated_cost == 0) {
            $rate = ($complexity === 'basic') ? 1800 : (($complexity === 'premium') ? 3500 : 2500);
            $project->estimated_cost = $area * $rate;
        }

        // Calculate durations
        $durations = $this->calcDuration($area, $floors, $complexity, $internal_type);
        $totalDays = $durations['total'];

        // Set dates
        $startDate = $project->start_date ?: Carbon::now()->addDays(1); // Start tomorrow if not set
        $endDate = $startDate->copy()->addDays($totalDays);

        $project->start_date = $startDate;
        $project->end_date = $endDate;
        
        // Sync description from lead segments
        $project->description = "Lead Notes: " . ($lead->notes ?? 'N/A') . "\n\n" . 
                                "First Call Requirements: " . ($firstCall['raw'] ?? 'N/A') . "\n" .
                                "Second Call Details: " . ($secondCall['raw'] ?? 'N/A');

        $project->saveQuietly();

        // Generate milestones & tasks if none exist
        if ($project->milestones()->count() === 0) {
            $this->generateMilestones($project, $internal_type, $area, $floors, $complexity, $startDate);
        }
    }

    private function mapServiceToType(string $service): string
    {
        $service = strtolower($service);
        if (str_contains($service, 'turnkey') || str_contains($service, 'construction')) {
            return 'full';
        }
        if (str_contains($service, 'pmc') || str_contains($service, 'management')) {
            return 'design_pmc';
        }
        return 'design';
    }

    private function getBestManagerId(): int
    {
        // Try to find a user with "Project Manager" designation who has the least active projects
        $manager = User::select('users.id')
            ->leftJoin('employee_profiles', 'users.id', '=', 'employee_profiles.user_id')
            ->leftJoin('projects', 'users.id', '=', 'projects.project_manager_id')
            ->where('employee_profiles.designation', 'like', '%Manager%')
            ->groupBy('users.id')
            ->orderByRaw('COUNT(projects.id) ASC')
            ->first();

        if ($manager) {
            return $manager->id;
        }

        // Fallback to first user
        return User::first()->id;
    }

    private function calcDuration($area, $floors, $complexity, $type): array
    {
        $base = $area < 1500 ? 'small' : ($area <= 5000 ? 'medium' : 'large');
        $designDays = $base === 'small' ? 30 : ($base === 'medium' ? 50 : 75);
        $pmcDays = $type === 'design' ? 0 : ($base === 'small' ? 20 : ($base === 'medium' ? 35 : 55));
        $conDays = $type !== 'full' ? 0 : ($base === 'small' ? 120 : ($base === 'medium' ? 210 : 300));
        
        $floorMult = 1 + ($floors - 1) * 0.18;
        $compMult = $complexity === 'basic' ? 0.85 : ($complexity === 'premium' ? 1.3 : 1);
        
        $designDays = round($designDays * $floorMult * $compMult);
        $pmcDays = round($pmcDays * $floorMult * $compMult);
        $conDays = round($conDays * $floorMult * $compMult);
        
        return [
            'designDays' => $designDays,
            'pmcDays' => $pmcDays,
            'conDays' => $conDays,
            'total' => $designDays + $pmcDays + $conDays
        ];
    }

    private function generateMilestones(Project $project, $type, $area, $floors, $complexity, Carbon $startDate)
    {
        $compMult = $complexity === 'basic' ? 0.8 : ($complexity === 'premium' ? 1.3 : 1);
        $dScale = function ($min, $max) use ($compMult) {
            return round($min + ($max - $min) * $compMult);
        };

        $milestones = [];
        // Design Phase
        $milestones[] = ['phase' => 'Design', 'name' => 'Requirement analysis', 'days' => $dScale(2, 5), 'tasks' => [
            ['name' => 'Client requirement collection', 'role' => 'Architect'],
            ['name' => 'Site data review', 'role' => 'Site Engineer'],
            ['name' => 'Feasibility check', 'role' => 'Senior Architect']
        ]];
        $milestones[] = ['phase' => 'Design', 'name' => 'Concept design', 'days' => $dScale(3, 7), 'tasks' => [
            ['name' => 'Concept planning', 'role' => 'Architect'],
            ['name' => 'Zoning layout', 'role' => 'Architect'],
            ['name' => 'Initial floor plan', 'role' => 'Draftsman']
        ]];
        $milestones[] = ['phase' => 'Design', 'name' => 'Schematic design', 'days' => $dScale(5, 10), 'tasks' => [
            ['name' => 'Detailed floor plan', 'role' => 'Architect'],
            ['name' => 'Basic elevation', 'role' => 'Architect'],
            ['name' => 'Client review iterations', 'role' => 'Architect']
        ]];
        $milestones[] = ['phase' => 'Design', 'name' => 'Elevation & 3D', 'days' => $dScale(5, 12), 'tasks' => [
            ['name' => 'Elevation design', 'role' => 'Architect'],
            ['name' => '3D visualization', 'role' => '3D Designer'],
            ['name' => 'Material concept', 'role' => 'Interior Designer']
        ]];
        $milestones[] = ['phase' => 'Design', 'name' => 'Technical design', 'days' => $dScale(7, 15), 'tasks' => [
            ['name' => 'Structural drawings', 'role' => 'Structural Engineer'],
            ['name' => 'MEP drawings', 'role' => 'MEP Engineer'],
            ['name' => 'Working drawings', 'role' => 'Draftsman']
        ]];
        $milestones[] = ['phase' => 'Design', 'name' => 'Approval drawings', 'days' => $dScale(3, 7), 'tasks' => [
            ['name' => 'Approval plan preparation', 'role' => 'Architect'],
            ['name' => 'Documentation', 'role' => 'Admin']
        ]];

        if ($type === 'design_pmc' || $type === 'full') {
            $milestones[] = ['phase' => 'PMC', 'name' => 'Project planning & scheduling', 'days' => $dScale(5, 10), 'tasks' => [
                ['name' => 'Master schedule creation', 'role' => 'Project Manager'],
                ['name' => 'Resource planning', 'role' => 'Project Manager']
            ]];
            $milestones[] = ['phase' => 'PMC', 'name' => 'Vendor finalization', 'days' => $dScale(7, 14), 'tasks' => [
                ['name' => 'Vendor shortlisting', 'role' => 'Project Manager'],
                ['name' => 'Contract finalization', 'role' => 'Project Manager']
            ]];
            $milestones[] = ['phase' => 'PMC', 'name' => 'Site execution monitoring', 'days' => $dScale(30, 60), 'tasks' => [
                ['name' => 'Daily site inspection', 'role' => 'Site Engineer'],
                ['name' => 'Weekly reporting', 'role' => 'Project Manager']
            ]];
            $milestones[] = ['phase' => 'PMC', 'name' => 'Quality & cost tracking', 'days' => $dScale(20, 40), 'tasks' => [
                ['name' => 'Quality audits', 'role' => 'Site Engineer'],
                ['name' => 'Cost variance tracking', 'role' => 'Project Manager']
            ]];
        }

        if ($type === 'full') {
            $milestones[] = ['phase' => 'Construction', 'name' => 'Foundation', 'days' => $dScale(14, 30), 'tasks' => [
                ['name' => 'Excavation', 'role' => 'Site Engineer'],
                ['name' => 'Footing & foundation work', 'role' => 'Site Engineer']
            ]];
            
            for ($f = 0; $f < min($floors, 10); $f++) {
                $fname = $f === 0 ? 'Ground floor' : "Floor {$f}";
                $milestones[] = ['phase' => 'Construction', 'name' => "Structure — {$fname}", 'days' => $dScale(14, 25), 'tasks' => [
                    ['name' => "Slab & column work — {$fname}", 'role' => 'Site Engineer'],
                    ['name' => "Shuttering & centering — {$fname}", 'role' => 'Site Engineer'],
                    ['name' => "Material tracking — {$fname}", 'role' => 'Project Manager']
                ]];
            }

            $milestones[] = ['phase' => 'Construction', 'name' => 'Masonry & plastering', 'days' => $dScale(20, 40), 'tasks' => [
                ['name' => 'Brick masonry', 'role' => 'Site Engineer'],
                ['name' => 'Internal plastering', 'role' => 'Site Engineer'],
                ['name' => 'External plastering', 'role' => 'Site Engineer']
            ]];
            
            $milestones[] = ['phase' => 'Construction', 'name' => 'Finishing & handover', 'days' => $dScale(25, 50), 'tasks' => [
                ['name' => 'Flooring & tiling', 'role' => 'Site Engineer'],
                ['name' => 'Painting & woodwork', 'role' => 'Site Engineer'],
                ['name' => 'MEP installations', 'role' => 'MEP Engineer'],
                ['name' => 'Final inspection & handover', 'role' => 'Project Manager']
            ]];
        }

        $currentDate = $startDate->copy();
        $adminUserId = User::first()->id;

        foreach ($milestones as $msData) {
            $msEnd = $currentDate->copy()->addDays($msData['days']);
            
            $milestone = Milestone::create([
                'project_id' => $project->id,
                'name' => '[' . $msData['phase'] . '] ' . $msData['name'],
                'due_date' => $msEnd,
                'status' => 'Pending'
            ]);

            foreach ($msData['tasks'] as $taskData) {
                // Try to find a user with the matching role/designation
                $assignedUser = User::whereHas('employeeProfile', function($q) use ($taskData) {
                    $q->where('designation', 'like', '%' . $taskData['role'] . '%');
                })->first();

                Task::create([
                    'title' => $taskData['name'],
                    'project_id' => $project->id,
                    'milestone_id' => $milestone->id,
                    'assigned_to' => $assignedUser ? $assignedUser->id : ($project->project_manager_id ?: $adminUserId),
                    'created_by' => $adminUserId,
                    'due_date' => $msEnd,
                    'status' => 'Pending',
                    'priority' => 'Medium'
                ]);
            }
            
            $currentDate = $msEnd->copy();
        }
    }
}
