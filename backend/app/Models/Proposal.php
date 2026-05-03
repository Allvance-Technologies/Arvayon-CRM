<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'project_id',
        'quote_id',
        'client_name',
        'project_location',
        'project_area',
        'title',
        'content',
        'estimated_value',
        'status',
        'ai_generated',
        'sent_date',
        'created_by',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'ai_generated' => 'boolean',
        'sent_date' => 'date',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
