<?php

namespace App\Services\PaymentService;

use App\Models\Order;
use App\Models\PaymentProcess;
use App\Models\Payout;
use App\Models\User;
use App\Services\PointTransactionService\PointTransactionService;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Http\JsonResponse;
use Throwable;

class TapPayService extends BaseService {

    protected Client $client;
    protected PointTransactionService $pointTransactionService;

    public function __construct(PointTransactionService $pointTransactionService)
    {
        $this->client = new Client();
        $this->pointTransactionService = $pointTransactionService;
    }

    protected function getModelClass(): string
    {
        return Payout::class;
    }

    /**
     * @param array $data
     * @return JsonResponse
     * @throws Throwable
     */
    public function orderProcessTransaction(array $data): JsonResponse
    {
        $order          = Order::find(data_get($data, 'order_id'));
//        \Log::info('Fetched Order Details:', ['order' => $order]);

        $response = $this->client->request('POST', 'https://api.tap.company/v2/charges/', [
            'body' => json_encode([
                'amount' => $order->total_price,
                'currency' => $order->currency->title,
                'customer_initiated' => true,
                'threeDSecure' => true,
                'save_card' => false,
//                'description' => "",
                'metadata' => [
                    "order_id" => $order->id,
                    "order_price" => $order->total_price - ($order->delivery_fee ?? 0),
                    "points_claimed" => false,
                ],
//                'reference' => "",
//                'receipt' => [
//                    'email' => true,
//                    'sms' => true,
//                ],
                'customer' => [
                    'first_name' => $order->user->firstname,
                    'last_name' => $order->user->lastname,
                    'email' => $order->user->email,
//                    'phone' =>"",
                ],
//                'merchant' => "",
                'source' => [
                    'id' => 'src_card'
                ],
                'post' => [
                    'url' => 'https://api.stagingmeatone.xyz/api/v1/dashboard/user/payments/webhook'
                ],
                'redirect' => [
                    'url' => 'https://site.stagingmeatone.xyz/orders/' . $order->id
                ],
            ]),
            'headers' => [
                'Authorization' => 'Bearer ' . env('TAP_PAYMENT_API_KEY'),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
        ]);

        PaymentProcess::updateOrCreate([
            'user_id'   => auth('sanctum')->id(),
            'order_id'  => data_get($data, 'order_id'),
        ], [
            'id'    => data_get(json_decode($response->getBody()), 'id'),
            'data'  => [
                'url'   => data_get(data_get(json_decode($response->getBody()), 'transaction'), 'url'),
                'price' => $order->total_price,
                'order_id' => $order->id
            ]
        ]);

        return response()->json(json_decode($response->getBody(), true));
    }

    /**
     * @throws GuzzleException
     * @throws Throwable
     */
    public function getCharge(string $id, int $orderId): JsonResponse
    {
        $response = $this->client->request('GET', 'https://api.tap.company/v2/charges/' . $id, [
            'headers' => [
                'Authorization' => 'Bearer ' . env('TAP_PAYMENT_API_KEY'),
                'Accept' => 'application/json',
            ],
        ]);
        $chargeDetails = json_decode($response->getBody(), true);
        $chargeStatus = $chargeDetails['status'];

        // change order transaction status based on charge status
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($chargeStatus === 'ABANDONED') {
            $order->transaction->status = 'canceled';
        } else if  ($chargeStatus === 'INITIATED') {
            $order->transaction->status = 'progress';
        } else if  ($chargeStatus === 'CAPTURED') {
            $order->transaction->status = 'paid';

            // if payment is done and user has not claimed points into account then add points
            if ($chargeDetails['metadata']['points_claimed'] === "false") {
                $orderPrice = $order->total_price - ($order->delivery_fee ?? 0);  // total points
                $user = User::find($order->user_id);

                $this->pointTransactionService->recordTransaction($user, (int)$orderPrice, 'earn', "Points earned from Order");
                \Log::info('Points added to User:', [
                    'points' => $orderPrice,
                    'user_id' => $user->id
                ]);

                // now update the charge points_claimed to true so on refresh it is not added again
                $chargeId = $chargeDetails['id'];

                $updateResponse = $this->client->request('PUT', 'https://api.tap.company/v2/charges/' . $chargeId, [
                    'headers' => [
                        'Authorization' => 'Bearer ' . env('TAP_PAYMENT_API_KEY'),
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'metadata' => [
                            "order_id" => $order->id,
                            "order_price" => $orderPrice,
                            "points_claimed" => true,
                        ],
                    ],
                ]);
            }
        } else {
            $order->transaction->status = 'progress';  // default
        }
        $order->transaction->save();   // save transaction

        return response()->json($chargeDetails);
    }
}
