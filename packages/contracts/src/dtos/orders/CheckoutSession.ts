export interface CreateCheckoutSessionRequest {
  orderId: string;
}

export interface CheckoutSessionResponse {
  /** @deprecated Use providerData.clientSecret — kept for Stripe backward compat. */
  clientSecret?: string;
  paymentIntentId: string;
  orderId: string;
  amount: string;
  currency: string;
  /** Provider-specific data (e.g. Stripe clientSecret, crypto wallet address). */
  providerData: Record<string, unknown>;
}
