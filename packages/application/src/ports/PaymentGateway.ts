import type { Money, CurrencyCode } from '@ecomsaas/domain';

export interface CreatePaymentIntentInput {
  orderId: string;
  amount: Money;
  currency: CurrencyCode;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  amount: Money;
  currency: CurrencyCode;
  /** Provider-specific data passed through to the client (e.g. Stripe clientSecret, crypto wallet address). */
  providerData: Record<string, unknown>;
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
      provider: string;
      providerEventId: string;
      providerPaymentId: string;
      orderId: string;
      amount: number;
      currency: string;
    }
  | {
      kind: 'PaymentFailed';
      provider: string;
      providerEventId: string;
      providerPaymentId: string;
      orderId?: string;
      reason: string;
    }
  | {
      kind: 'PaymentPending';
      provider: string;
      providerEventId: string;
      providerPaymentId: string;
      orderId?: string;
    }
  | {
      kind: 'Unknown';
      provider: string;
      providerEventId: string;
      rawType: string;
    };

export interface PaymentGateway {
  /** Identifier for this payment provider (e.g. 'stripe', 'crypto'). */
  readonly provider: string;

  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  confirmPaymentIntent(paymentIntentId: string): Promise<{ status: string }>;
  cancelPaymentIntent(paymentIntentId: string): Promise<void>;

  /** Verify signature and return the raw provider event (used for logging). */
  constructWebhookEvent(payload: Uint8Array, signature: string): WebhookEvent;

  /** Verify signature and return a normalized PaymentEvent. */
  parseWebhookEvent(payload: Uint8Array, signature: string): PaymentEvent;
}
