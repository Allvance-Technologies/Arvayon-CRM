<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavedFilter extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'entity_type',
        'filter_config',
        'is_default',
    ];

    protected $casts = [
        'filter_config' => 'array',
        'is_default' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
