<?php

namespace App\Http\Controllers;

use App\Models\AIFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AIFeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'feature_type' => 'required|in:lead_scoring,delay_prediction,proposal_generation',
            'entity_id' => 'required|integer',
            'entity_type' => 'required|in:Lead,Project',
            'feedback_type' => 'required|in:thumbs_up,thumbs_down,rating',
            'feedback_value' => 'nullable|numeric|min:1|max:5',
            'comment' => 'nullable|string',
            'predicted_value' => 'nullable|string',
            'actual_value' => 'nullable|string',
        ]);

        $validated['user_id'] = auth()->id();

        $feedback = AIFeedback::create($validated);

        return response()->json(['data' => $feedback], 201);
    }

    public function metrics(Request $request)
    {
        $featureType = $request->input('feature_type');

        $query = AIFeedback::query();

        if ($featureType) {
            $query->where('feature_type', $featureType);
        }

        $totalFeedback = $query->count();
        
        $positiveCount = (clone $query)->where('feedback_type', 'thumbs_up')->count();
        $negativeCount = (clone $query)->where('feedback_type', 'thumbs_down')->count();
        
        $averageRating = (clone $query)
            ->where('feedback_type', 'rating')
            ->avg('feedback_value');

        $accuracyData = (clone $query)
            ->whereNotNull('actual_value')
            ->whereNotNull('predicted_value')
            ->get()
            ->map(function ($item) {
                return [
                    'predicted' => $item->predicted_value,
                    'actual' => $item->actual_value,
                    'match' => $item->predicted_value == $item->actual_value,
                ];
            });

        $accuracy = $accuracyData->count() > 0 
            ? ($accuracyData->where('match', true)->count() / $accuracyData->count()) * 100 
            : null;

        return response()->json([
            'data' => [
                'total_feedback' => $totalFeedback,
                'positive_count' => $positiveCount,
                'negative_count' => $negativeCount,
                'average_rating' => round($averageRating, 2),
                'accuracy_percentage' => $accuracy ? round($accuracy, 2) : null,
                'feature_type' => $featureType,
            ],
        ]);
    }

    public function recordActualOutcome(Request $request)
    {
        $validated = $request->validate([
            'feedback_id' => 'required|exists:ai_feedback,id',
            'actual_value' => 'required|string',
        ]);

        $feedback = AIFeedback::findOrFail($validated['feedback_id']);
        $feedback->update(['actual_value' => $validated['actual_value']]);

        return response()->json(['data' => $feedback]);
    }
}
