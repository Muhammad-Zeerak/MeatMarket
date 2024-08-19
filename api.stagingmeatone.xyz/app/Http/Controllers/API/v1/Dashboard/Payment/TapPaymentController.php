<?php

namespace App\Http\Controllers\API\v1\Dashboard\Payment;

use App\Models\Order;
use App\Models\WalletHistory;
use App\Services\PaymentService\TapPayService;
use App\Traits\ApiResponse;
use App\Traits\OnResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use GuzzleHttp\Client;
use Throwable;
use Redirect;

class TapPaymentController extends Controller
{
    protected Client $client;
    use OnResponse, ApiResponse;

    public function __construct(private TapPayService $service)
    {
        parent::__construct();
        $this->client = new Client();
    }

    /**
     * process transaction.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function orderProcessTransaction(Request $request): JsonResponse
    {
        try {
            $paymentProcess = $this->service->orderProcessTransaction($request->all());

            return $this->successResponse('success', $paymentProcess);
        } catch (Throwable $e) {
            return $this->onErrorResponse(['message' => $e->getMessage()]);
        }
    }

    /**
     * @param Request $request
     * @return RedirectResponse
     */
    public function orderResultTransaction(Request $request): RedirectResponse
    {
        $orderId = (int)$request->input('order_id');

        $to = config('app.front_url') . "orders/$orderId";

        $order = Order::find($orderId);
        $order->transaction->status = 'paid';
        $order->transaction->save();

        return Redirect::to($to);
    }

    /**
     * @param Request $request
     * @return void
     */
    public function paymentWebHook(Request $request): void
    {
        $token  = $request->input('id');
        $status = $request->input('status');

        $status = match ($status) {
            'ABANDONED'        => WalletHistory::CANCELED,
            'INITIATED'        => WalletHistory::PROCESSED,
            'CAPTURED'         => WalletHistory::PAID,
            default => 'progress',
        };

        $this->service->afterHook($token, $status);
    }

    /**
     * Get charge details.
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function getCharge(Request $request, string $id): JsonResponse
    {
        $orderId = (int)$request->query('order_id');

        try {
            $chargeDetails = $this->service->getCharge($id, $orderId);

            return $this->successResponse('Charge details retrieved successfully.', $chargeDetails);
        } catch (Throwable $e) {
            return $this->onErrorResponse(['message' => $e->getMessage()]);
        }
    }
}
