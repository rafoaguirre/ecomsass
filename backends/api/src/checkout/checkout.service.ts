import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlaceOrder, ConfirmOrder } from '@ecomsaas/application/use-cases';
import type { OrderRepository } from '@ecomsaas/application/ports';
import type { CheckoutSessionResponse, CreateOrderRequest } from '@ecomsaas/contracts';
import type { AuthUser } from '../auth/types/auth-user';
import { ORDER_REPOSITORY } from '../orders/order.tokens';
import { PAYMENT_GATEWAY } from './checkout.tokens';
import { StripePaymentGateway } from './stripe-payment.gateway';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private readonly processedEvents = new Set<string>();

  constructor(
    @Inject(PlaceOrder) private readonly placeOrder: PlaceOrder,
    @Inject(ConfirmOrder) private readonly confirmOrder: ConfirmOrder,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: StripePaymentGateway
  ) {}

  /**
   * Create order(s) from cart and return Stripe PaymentIntent client secret.
   *
   * Multi-vendor carts are split into one order per store, but we create
   * a single PaymentIntent for the combined total for simplicity.
   * Platform-level splitting (Stripe Connect) can be added later.
   */
  async createCheckoutSession(
    body: CreateOrderRequest,
    storeId: string,
    user: AuthUser
  ): Promise<CheckoutSessionResponse> {
    // 1. Place the order via the use case
    const orderResult = await this.placeOrder.execute({
      storeId,
      userId: user.id,
      items: body.items,
      paymentMethod: body.payment.method,
      fulfillment: {
        ...body.fulfillment,
        scheduledFor: body.fulfillment.scheduledFor
          ? new Date(body.fulfillment.scheduledFor)
          : undefined,
      },
      notes: body.notes,
      metadata: body.metadata,
    });

    if (orderResult.isErr()) {
      throw orderResult.error;
    }

    const order = orderResult.value;

    // 2. Create Stripe PaymentIntent
    const paymentResult = await this.paymentGateway.createPaymentIntent({
      orderId: order.id,
      amount: order.total,
      currency: order.total.currency,
    });

    // 3. Update the order with the stripe payment intent ID
    const updatedOrder = order.updatePayment({
      stripePaymentIntentId: paymentResult.paymentIntentId,
    });
    await this.orderRepository.save(updatedOrder);

    return {
      clientSecret: paymentResult.clientSecret,
      paymentIntentId: paymentResult.paymentIntentId,
      orderId: order.id,
      amount: order.total.amount.toString(),
      currency: order.total.currency,
    };
  }

  /**
   * Handle Stripe webhook events.
   */
  async handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
    const event = this.paymentGateway.constructWebhookEvent(payload, signature);

    // Idempotency: skip already-processed events
    if (this.processedEvents.has(event.id)) {
      this.logger.log(`Skipping already-processed webhook event: ${event.id}`);
      return;
    }

    this.logger.log(`Stripe webhook event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (!orderId) {
          this.logger.warn('PaymentIntent succeeded without orderId in metadata');
          break;
        }

        const result = await this.confirmOrder.execute({
          orderId,
          paymentIntentId: paymentIntent.id,
        });

        if (result.isErr()) {
          // Throw so Stripe retries the webhook for transient failures
          throw new Error(`Failed to confirm order ${orderId}: ${result.error.message}`);
        }

        this.logger.log(`Order ${orderId} confirmed via Stripe webhook`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          this.logger.warn(
            `Payment failed for order ${orderId}: ${paymentIntent.last_payment_error?.message ?? 'unknown'}`
          );
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    // Only mark as processed after successful handling.
    // If we threw above, Stripe will retry the webhook.
    this.processedEvents.add(event.id);

    // Prevent memory leak: cap the set size
    if (this.processedEvents.size > 10_000) {
      const first = this.processedEvents.values().next().value;
      if (first) this.processedEvents.delete(first);
    }
  }
}
