import { Paginate, Payment } from "interfaces";
import request from "./request";

const paymentService = {
  createTransaction: (id: number, data: any) =>
    request.post(`/payments/order/${id}/transactions`, data),
  getAll: (params?: any): Promise<Paginate<Payment>> =>
    request.get(`/rest/payments`, { params }),
  stripePay: (params: any) =>
    request.get(`/dashboard/user/order-stripe-process`, { params }),
  razorPay: (params: any) =>
    request.get(`/dashboard/user/order-razorpay-process`, { params }),
  paystackPay: (params: any) =>
    request.get(`/dashboard/user/order-paystack-process`, { params }),
  tapPay: (params: any) => request.post(`/dashboard/user/payments/create`, null, {
    params: {
      order_id: params.order_id
    }
  }),
  
};

export default paymentService;
