<?php

namespace App\Services\PointTransactionService;

use App\Models\User;
use App\Models\PointTransaction;
use DB;

class PointTransactionService
{
    /**
     * Record a point transaction for a user and update points.
     *
     * @param User $user
     * @param int $points
     * @param string $type
     * @param string|null $description
     * @return PointTransaction
     * @throws \Throwable
     */
    public function recordTransaction(User $user, int $points, string $type, ?string $description = null): PointTransaction
    {
        // Start a database transaction to ensure data integrity
        DB::beginTransaction();

        try {
            // Create a new point transaction record
            $transaction = new PointTransaction([
                'user_id' => $user->id,
                'points' => $points,
                'type' => $type,
                'description' => $description,
                'transaction_date' => now(),
            ]);
            $transaction->save();

            // Update the user's points balance based on transaction type
            if ($type === 'earn') {
                $user->points_balance += $points;
            } elseif ($type === 'redeem') {
                $user->points_balance -= $points;
            }

            // Save the updated user object
            $user->save();

            // Commit the transaction if everything is successful
            DB::commit();

            return $transaction;
        } catch (\Exception $e) {
            // Rollback the transaction if an error occurs
            DB::rollBack();

            // Optionally handle or log the exception
            throw $e;
        }
    }
}
