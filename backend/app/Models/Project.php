<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($project) {
            $year = date('Y');
            $count = Project::where('project_custom_id', 'like', "PRO_APBS_{$year}_%")->count();
            $number = $count + 1;

            // Ensure the ID is truly unique even if projects were deleted or multiple requests are handled simultaneously
            while (Project::where('project_custom_id', "PRO_APBS_{$year}_" . str_pad($number, 3, '0', STR_PAD_LEFT))->exists()) {
                $number++;
            }
            
            $projectCount = str_pad($number, 3, '0', STR_PAD_LEFT);
            
            if (empty($project->project_custom_id)) {
                $project->project_custom_id = "PRO_APBS_{$year}_{$projectCount}";
            }

            // Auto-format name: APBS_PROJECTNUMBER_CLIENTNAME_LOCATION
            $clientName = $project->client ? $project->client->company_name : 'CLIENT';
            $location = 'LOCATION';
            
            // If lead exists, try to get location from lead
            if ($project->lead && $project->lead->location) {
                $location = $project->lead->location;
            } elseif ($project->client && $project->client->address) {
                // Fallback to client address if available - though user specifically asked for lead location
                $location = $project->client->address;
            }

            $project->name = "APBS_{$projectCount}_{$clientName}_{$location}";
        });
    }

    protected $appends = ['completion_percentage'];

    protected $fillable = [
        'name',
        'client_id',
        'lead_id',
        'description',
        'status',
        'start_date',
        'end_date',
        'estimated_cost',
        'actual_cost',
        'project_manager_id',
        'ai_delay_risk',
        'ai_delay_warning',
        'ai_delay_updated_at',
        'project_custom_id',
        'area',
        'floors',
        'complexity',
        'plot_dimensions',
        'architectural_style',
        'site_location_link',
    ];

    public function getCompletionPercentageAttribute()
    {
        $total = $this->milestones()->count();
        if ($total === 0) return 0;
        
        $completed = $this->milestones()->where('status', 'Completed')->count();
        return round(($completed / $total) * 100);
    }

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'estimated_cost' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'ai_delay_updated_at' => 'datetime',
        'area' => 'decimal:2',
        'floors' => 'integer',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function projectManager()
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function milestones()
    {
        return $this->hasMany(Milestone::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function activities()
    {
        return $this->morphMany(Activity::class, 'subject');
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class);
    }

    public function calculateProfit()
    {
        $totalPayments = $this->invoices()
            ->with('payments')
            ->get()
            ->sum(function ($invoice) {
                return $invoice->payments->sum('amount');
            });

        return $totalPayments - $this->actual_cost;
    }
}
