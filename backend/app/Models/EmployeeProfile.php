<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'designation',
        'department',
        'phone',
        'address',
        'join_date',
        'status',
        'linkedin',
        'instagram',
        'whatsapp',
        'facebook',
        'website',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
