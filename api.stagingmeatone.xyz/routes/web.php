<?php

use App\Http\Controllers\API\v1\Dashboard\Payment\{MercadoPagoController,
    PayStackController,
    RazorPayController,
    StripeController,
    TapPaymentController};
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('order-stripe-success', [StripeController::class, 'orderResultTransaction']);

//Route::get('order-paypal-success', [PayPalController::class, 'orderResultTransaction']);

Route::get('order-razorpay-success', [RazorPayController::class, 'orderResultTransaction']);

Route::get('order-paystack-success', [PayStackController::class, 'orderResultTransaction']);

Route::get('order-mercado-pago-success', [MercadoPagoController::class, 'orderResultTransaction']);

Route::get('payments/success', [TapPaymentController::class, 'orderResultTransaction'])->name('payment.success');

Route::get('/', function () {
    return view('welcome');
});

