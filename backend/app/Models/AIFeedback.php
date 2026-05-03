<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIFeedback extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'ai_feedback';

    protected $fillable = [
        'user_id',
        'feedback_type',
        'subject_type',
        'subject_id',
        'rating',
        'prediction_value',
        'actual_outcome',
        'confidence_score',
        'notes',
        'created_at',
    ];

    protected $casts = [
        'confidence_score' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
