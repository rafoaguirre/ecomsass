import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PaymentGateway,
  CreatePaymentIntentInput,
  PaymentIntentResult,
  WebhookEvent,
  PaymentEvent,
} from '@ecomsaas/application/ports';
import type { CurrencyCode } from '@ecomsaas/domain';
import type { AppConfig } from '../config';

@Injectable()
export class StripePaymentGateway implements PaymentGateway {
  readonly provider = 'stripe';

  private _stripe: InstanceType<typeof Stripe> | undefined;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  private get stripe(): InstanceType<typeof Stripe> {
    if (!this._stripe) {
      const secretKey = this.config.get('STRIPE_SECRET_KEY', { infer: true });
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
      amount: input.amount,
      currency: input.amount.currency as CurrencyCode,
      providerData: { clientSecret: paymentIntent.client_secret },
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
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
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
          provider: this.provider,
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
          provider: this.provider,
          providerEventId: event.id,
          providerPaymentId: pi.id,
          orderId: pi.metadata?.orderId,
          reason: pi.last_payment_error?.message ?? 'unknown',
        };
      }

      default:
        return {
          kind: 'Unknown',
          provider: this.provider,
          providerEventId: event.id,
          rawType: event.type,
        };
    }
  }
}
