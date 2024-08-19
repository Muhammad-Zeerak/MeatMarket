<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PointTransactionService\PointTransactionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PointTransactionController extends Controller
{
    use ApiResponse;

    protected PointTransactionService $pointTransactionService;

    public function __construct(PointTransactionService $pointTransactionService)
    {
        $this->pointTransactionService = $pointTransactionService;
    }

    /**
     * Handle earning points for a user.
     *
     * Request payload example:
     * {
     *   "user_id": 1,
     *   "points": 100,
     *   "description": "Optional description"
     * }
     *
     * @param Request $request
     * @return JsonResponse
     * @throws \Throwable
     */
    public function earnPoints(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer',
            'points' => 'required|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $user = User::find($request->input('user_id'));
        $points = $request->input('points');
        $description = $request->input('description', 'Earned points');

        // try {
            $this->pointTransactionService->recordTransaction($user, $points, 'earn', $description);
            return $this->successResponse('Points earned successfully');
        // } catch (\Exception $e) {
            // return $this->errorResponse('500', 'Failed to earn points');
        // }
    }

    /**
     * Handle redeeming points for a user.
     *
     * Request payload example:
     * {
     *   "user_id": 1,
     *   "points": 50,
     *   "description": "Optional description"
     * }
     *
     * @param Request $request
     * @return JsonResponse
     * @throws \Throwable
     */
    public function redeemPoints(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer',
            'points' => 'required|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $user = User::find($request->input('user_id'));
        $points = $request->input('points');
        $description = $request->input('description', 'Redeemed points');

        // Check if user has enough points to redeem
        if ($user->points_balance < 25) {
            return $this->errorResponse('not_enough_points', 'Not enough points to redeem.', Response::HTTP_BAD_REQUEST);
        }

        // Check if requested points are greater than user's points
        if ($points > $user->points_balance) {
            return $this->errorResponse('insufficient_points', 'Insufficient points.', Response::HTTP_BAD_REQUEST);
        }

        try {
            $this->pointTransactionService->recordTransaction($user, $points, 'redeem', $description);
        } catch (\Exception $e) {
            // Handle any exception that occurs during transaction recording
            return $this->errorResponse('transaction_failed', 'Failed to process transaction.', Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        return $this->successResponse('Points redeemed successfully');
    }
}
