import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlaceOrder, ConfirmOrder } from '@ecomsaas/application/use-cases';
import type {
  OrderRepository,
  PaymentGateway,
  PaymentRepository,
  WebhookEventLog,
} from '@ecomsaas/application/ports';
import type { CheckoutSessionResponse, CreateOrderRequest } from '@ecomsaas/contracts';
import type { Payment, CurrencyCode } from '@ecomsaas/domain';
import { PaymentMethod, PaymentStatus } from '@ecomsaas/domain';
import { createIdGenerator } from '@ecomsaas/infrastructure/id-generator';
import type { AuthUser } from '../auth/types/auth-user';
import { ORDER_REPOSITORY } from '../orders/order.tokens';
import { PAYMENT_GATEWAY, WEBHOOK_EVENT_LOG, PAYMENT_REPOSITORY } from './checkout.tokens';

const idGen = createIdGenerator();

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @Inject(PlaceOrder) private readonly placeOrder: PlaceOrder,
    @Inject(ConfirmOrder) private readonly confirmOrder: ConfirmOrder,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGateway,
    @Inject(WEBHOOK_EVENT_LOG) private readonly webhookEventLog: WebhookEventLog,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepository: PaymentRepository
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

    // 2. Create Stripe PaymentIntent — compensate by cancelling order on failure
    let paymentResult;
    try {
      paymentResult = await this.paymentGateway.createPaymentIntent({
        orderId: order.id,
        amount: order.total,
        currency: order.total.currency,
      });
    } catch (paymentError) {
      // Compensate: cancel the order since payment setup failed
      const cancelled = order.cancel();
      await this.orderRepository.save(cancelled);
      this.logger.error(
        `Payment creation failed for order ${order.id}, order cancelled`,
        paymentError
      );
      throw paymentError;
    }

    // 3. Update the order with the payment provider ID — compensate by cancelling PaymentIntent on failure
    const updatedOrder = order.updatePayment({
      provider: 'stripe',
      providerPaymentId: paymentResult.paymentIntentId,
    });

    const saveResult = await this.orderRepository.save(updatedOrder);
    if (saveResult.isErr()) {
      // Compensate: cancel the PaymentIntent since order update failed
      try {
        await this.paymentGateway.cancelPaymentIntent(paymentResult.paymentIntentId);
      } catch (cancelError) {
        this.logger.error(
          `CRITICAL: Failed to cancel PaymentIntent ${paymentResult.paymentIntentId} after order save failure`,
          cancelError
        );
      }
      throw saveResult.error;
    }

    // 4. Record the payment attempt in the payments table
    const paymentRecord: Payment = {
      id: idGen.generate(),
      orderId: order.id,
      storeId: order.storeId,
      provider: 'stripe',
      providerPaymentId: paymentResult.paymentIntentId,
      method: order.payment.method,
      status: PaymentStatus.Initiated,
      amount: order.total,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const recordResult = await this.paymentRepository.record(paymentRecord);
    if (recordResult.isErr()) {
      this.logger.error(
        `Failed to record payment for order ${order.id}: ${recordResult.error.message}`
      );
    }

    return {
      clientSecret: paymentResult.clientSecret,
      paymentIntentId: paymentResult.paymentIntentId,
      orderId: order.id,
      amount: order.total.amount.toString(),
      currency: order.total.currency,
    };
  }

  /**
   * Handle provider webhook events using normalized PaymentEvent.
   */
  async handleWebhookEvent(payload: Uint8Array, signature: string): Promise<void> {
    const event = this.paymentGateway.parseWebhookEvent(payload, signature);

    // Durable idempotency: skip already-processed events
    if (await this.webhookEventLog.isDuplicate('stripe', event.providerEventId)) {
      this.logger.log(`Duplicate webhook event skipped: ${event.kind} (${event.providerEventId})`);
      return;
    }

    this.logger.log(`Payment event: ${event.kind} (${event.providerEventId})`);

    switch (event.kind) {
      case 'PaymentConfirmed': {
        if (!event.orderId) {
          this.logger.warn('PaymentConfirmed without orderId');
          break;
        }

        const result = await this.confirmOrder.execute({
          orderId: event.orderId,
          paymentIntentId: event.providerPaymentId,
          amount: event.amount,
          currency: event.currency,
        });

        if (result.isErr()) {
          // Optimistic concurrency conflict means another webhook delivery
          // already confirmed this order — treat as idempotent success.
          if (result.error.message.includes('concurrency conflict')) {
            this.logger.log(`Concurrent confirm for order ${event.orderId}, treating as success`);
            break;
          }
          // Throw so provider retries the webhook for transient failures
          throw new Error(`Failed to confirm order ${event.orderId}: ${result.error.message}`);
        }

        // Record confirmed payment in payments table
        const confirmedOrder = result.value;
        const confirmedPayment: Payment = {
          id: idGen.generate(),
          orderId: event.orderId,
          storeId: confirmedOrder.storeId,
          provider: 'stripe',
          providerPaymentId: event.providerPaymentId,
          providerEventId: event.providerEventId,
          method: confirmedOrder.payment.method,
          status: PaymentStatus.Paid,
          amount: {
            amount: BigInt(event.amount),
            currency: event.currency.toUpperCase() as CurrencyCode,
          },
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await this.paymentRepository.record(confirmedPayment);

        this.logger.log(`Order ${event.orderId} confirmed via webhook`);
        break;
      }

      case 'PaymentFailed': {
        // Record failure in payments table for audit trail
        if (event.orderId) {
          const failedPayment: Payment = {
            id: idGen.generate(),
            orderId: event.orderId,
            storeId: '', // Not available from the event; will be empty for failed payments
            provider: 'stripe',
            providerPaymentId: event.providerPaymentId,
            providerEventId: event.providerEventId,
            method: PaymentMethod.Card, // Default; overwritten below if order found
            status: PaymentStatus.Failed,
            amount: { amount: BigInt(0), currency: 'USD' as CurrencyCode },
            metadata: { reason: event.reason },
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Look up the order to get accurate storeId and amount
          const orderResult = await this.orderRepository.findById(event.orderId);
          if (orderResult.isOk()) {
            const order = orderResult.value;
            failedPayment.storeId = order.storeId;
            failedPayment.amount = order.total;
            failedPayment.method = order.payment.method;
          }

          await this.paymentRepository.record(failedPayment);
          this.logger.warn(`Payment failed for order ${event.orderId}: ${event.reason}`);
        }
        break;
      }

      case 'Unknown':
        this.logger.debug(`Unhandled provider event type: ${event.rawType}`);
        break;
    }

    // Record event only after successful processing
    await this.webhookEventLog.record('stripe', event.providerEventId, event.kind);
  }
}
