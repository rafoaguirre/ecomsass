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

/** Provider-neutral webhook event representation. */
export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount?: number;
      currency?: string;
      metadata?: Record<string, string>;
      last_payment_error?: { message: string };
    };
  };
}

/**
 * Normalized payment event — provider-agnostic representation
 * of what happened in the payment lifecycle.
 *
 * Each gateway adapter maps its native events to this union
 * so the checkout service never switches on provider strings.
 */
export type PaymentEvent =
  | {
      kind: 'PaymentConfirmed';
      providerEventId: string;
      providerPaymentId: string;
      orderId: string;
      amount: number;
      currency: string;
    }
  | {
      kind: 'PaymentFailed';
      providerEventId: string;
      providerPaymentId: string;
      orderId?: string;
      reason: string;
    }
  | {
      kind: 'Unknown';
      providerEventId: string;
      rawType: string;
    };

export interface PaymentGateway {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  confirmPaymentIntent(paymentIntentId: string): Promise<{ status: string }>;
  cancelPaymentIntent(paymentIntentId: string): Promise<void>;

  /** Verify signature and return the raw provider event (used for logging). */
  constructWebhookEvent(payload: Uint8Array, signature: string): WebhookEvent;

  /** Verify signature and return a normalized PaymentEvent. */
  parseWebhookEvent(payload: Uint8Array, signature: string): PaymentEvent;
}
