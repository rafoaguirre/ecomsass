export interface CreateCheckoutSessionRequest {
  orderId: string;
}

export interface CheckoutSessionResponse {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  amount: string;
  currency: string;
}
