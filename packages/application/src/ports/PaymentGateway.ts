import type { Money, CurrencyCode } from '@ecomsaas/domain';

export interface CreatePaymentIntentInput {
  orderId: string;
  amount: Money;
  currency: CurrencyCode;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: Money;
  currency: CurrencyCode;
}

export interface PaymentGateway {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  confirmPaymentIntent(paymentIntentId: string): Promise<{ status: string }>;
  cancelPaymentIntent(paymentIntentId: string): Promise<void>;
}
