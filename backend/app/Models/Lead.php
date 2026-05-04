<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($lead) {
            if (empty($lead->lead_custom_id)) {
                $year = date('Y');
                $count = Lead::where('lead_custom_id', 'like', "LEAD_APBS_{$year}_%")->count();
                $number = $count + 1;
                
                // Ensure the ID is truly unique even if leads were deleted or multiple requests are handled simultaneously
                while (Lead::where('lead_custom_id', "LEAD_APBS_{$year}_" . str_pad($number, 3, '0', STR_PAD_LEFT))->exists()) {
                    $number++;
                }
                
                $lead->lead_custom_id = "LEAD_APBS_{$year}_" . str_pad($number, 3, '0', STR_PAD_LEFT);
            }
        });
    }

    protected $fillable = [
        'company_name',
        'contact_person',
        'email',
        'phone',
        'location',
        'source',
        'industry',
        'estimated_value',
        'status',
        'assigned_to',
        'ai_score',
        'ai_score_updated_at',
        'notes',
        'first_call',
        'second_call',
        'lost_reason',
        'won_date',
        'created_by',
        'lead_custom_id',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'ai_score' => 'decimal:2',
        'ai_score_updated_at' => 'datetime',
        'won_date' => 'date',
    ];

    // Relationships
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class);
    }

    public function activities()
    {
        return $this->morphMany(Activity::class, 'subject');
    }

    public function project()
    {
        return $this->hasOne(Project::class);
    }

    // Scopes
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeSearch($query, $search)
    {
        return $query->whereFullText(['company_name', 'contact_person', 'notes'], $search);
    }

    // Helper methods
    public function isWon(): bool
    {
        return $this->status === 'Won';
    }

    public function isLost(): bool
    {
        return $this->status === 'Lost';
    }

    public function isActive(): bool
    {
        return !in_array($this->status, ['Won', 'Lost']);
    }
}
