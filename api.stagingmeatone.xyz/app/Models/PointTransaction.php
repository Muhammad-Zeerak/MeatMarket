<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class PointTransaction extends Model
{
    use HasFactory;
    
    public $timestamps = false; // Disable default timestamps

    protected $guarded = ['id'];

    protected $casts = [
        'transaction_date' => 'datetime:Y-m-d H:i:s',
    ];

    protected $dates = [
        'transaction_date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->transaction_date = $model->freshTimestamp();
        });
    }
}
