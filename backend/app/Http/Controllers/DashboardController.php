<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $cacheKey = 'dashboard_data_' . auth()->id();

        $data = Cache::remember($cacheKey, 300, function () {
            return [
                'kpis' => $this->getKPIs(),
                'sales_funnel' => $this->getSalesFunnel(),
                'upcoming_tasks' => $this->getUpcomingTasks(),
                'ai_insights' => $this->getAIInsights(),
                'project_progress' => $this->getProjectProgress(),
            ];
        });

        return response()->json(['data' => $data]);
    }

    private function getKPIs()
    {
        $totalLeads = Lead::count();
        
        $revenueWonThisMonth = Payment::whereYear('payment_date', now()->year)
            ->whereMonth('payment_date', now()->month)
            ->sum('amount');
        
        $activeProjects = Project::whereIn('status', ['Planning', 'In Progress'])->count();
        
        $totalRevenue = Payment::sum('amount');
        
        $overdueInvoices = Invoice::where('due_date', '<', now())
            ->where('status', '!=', 'Paid')
            ->count();

        return [
            'total_leads' => $totalLeads,
            'revenue_won_this_month' => $revenueWonThisMonth,
            'active_projects' => $activeProjects,
            'total_revenue' => $totalRevenue,
            'overdue_invoices' => $overdueInvoices,
        ];
    }

    private function getSalesFunnel()
    {
        return Lead::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');
    }

    private function getUpcomingTasks()
    {
        return Task::with(['assignedUser', 'project'])
            ->where('assigned_to', auth()->id())
            ->where('status', '!=', 'Completed')
            ->orderBy('due_date')
            ->limit(5)
            ->get();
    }

    private function getAIInsights()
    {
        $highScoreLeads = Lead::where('ai_score', '>=', 70)
            ->where('status', 'not in', ['Won', 'Lost'])
            ->orderBy('ai_score', 'desc')
            ->limit(5)
            ->get();

        $atRiskProjects = Project::whereIn('ai_delay_risk', ['High', 'Medium'])
            ->whereIn('status', ['Planning', 'In Progress'])
            ->orderByRaw("CASE ai_delay_risk WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END")
            ->limit(5)
            ->get();

        return [
            'high_score_leads' => $highScoreLeads,
            'at_risk_projects' => $atRiskProjects,
        ];
    }

    private function getProjectProgress()
    {
        return Project::with(['milestones'])
            ->whereIn('status', ['Planning', 'In Progress'])
            ->limit(5)
            ->get()
            ->map(function ($project) {
                $totalMilestones = $project->milestones->count();
                $completedMilestones = $project->milestones->where('status', 'Completed')->count();
                $progress = $totalMilestones > 0 ? ($completedMilestones / $totalMilestones) * 100 : 0;

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'progress' => round($progress, 2),
                    'status' => $project->status,
                ];
            });
    }
}
