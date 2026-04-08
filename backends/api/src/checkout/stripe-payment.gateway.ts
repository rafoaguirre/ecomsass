import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import type {
  PaymentGateway,
  CreatePaymentIntentInput,
  PaymentIntentResult,
} from '@ecomsaas/application/ports';
import type { CurrencyCode } from '@ecomsaas/domain';

@Injectable()
export class StripePaymentGateway implements PaymentGateway {
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(secretKey);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructWebhookEvent(payload: Buffer, signature: string): any {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
