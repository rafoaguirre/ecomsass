import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import type {
  PaymentGateway,
  CreatePaymentIntentInput,
  PaymentIntentResult,
  WebhookEvent,
  PaymentEvent,
} from '@ecomsaas/application/ports';
import type { CurrencyCode } from '@ecomsaas/domain';

@Injectable()
export class StripePaymentGateway implements PaymentGateway {
  private _stripe: InstanceType<typeof Stripe> | undefined;

  private get stripe(): InstanceType<typeof Stripe> {
    if (!this._stripe) {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required');
      }
      this._stripe = new Stripe(secretKey);
    }
    return this._stripe;
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Number(input.amount.amount),
      currency: input.amount.currency.toLowerCase(),
      metadata: {
        orderId: input.orderId,
        ...input.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Stripe did not return a client secret');
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: input.amount,
      currency: input.amount.currency as CurrencyCode,
    };
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<{ status: string }> {
    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return { status: pi.status };
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    await this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  /**
   * Verify a webhook signature and parse the event.
   */
  constructWebhookEvent(payload: Uint8Array, signature: string): WebhookEvent {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event as unknown as WebhookEvent;
  }

  /**
   * Verify signature and map Stripe events to a normalized PaymentEvent.
   */
  parseWebhookEvent(payload: Uint8Array, signature: string): PaymentEvent {
    const event = this.constructWebhookEvent(payload, signature);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        return {
          kind: 'PaymentConfirmed',
          providerEventId: event.id,
          providerPaymentId: pi.id,
          orderId: pi.metadata?.orderId ?? '',
          amount: pi.amount ?? 0,
          currency: pi.currency ?? '',
        };
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        return {
          kind: 'PaymentFailed',
          providerEventId: event.id,
          providerPaymentId: pi.id,
          orderId: pi.metadata?.orderId,
          reason: pi.last_payment_error?.message ?? 'unknown',
        };
      }

      default:
        return {
          kind: 'Unknown',
          providerEventId: event.id,
          rawType: event.type,
        };
    }
  }
}
