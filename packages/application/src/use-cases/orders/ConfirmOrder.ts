import { PaymentStatus, OrderStatus, err, ok } from '@ecomsaas/domain';
import type { OrderModel, Result } from '@ecomsaas/domain';
import type { OrderRepository } from '../../ports';

export interface ConfirmOrderInput {
  orderId: string;
  paymentIntentId: string;
}

/**
 * ConfirmOrder Use Case
 *
 * Called when a payment is successfully completed (e.g. via Stripe webhook).
 * Confirms the order and updates the payment status to PAID.
 *
 * This use case is idempotent: if the order is already confirmed (or beyond),
 * it returns the current state without error — safe for webhook redelivery.
 */
export class ConfirmOrder {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ConfirmOrderInput): Promise<Result<OrderModel, Error>> {
    const findResult = await this.orderRepository.findById(input.orderId);
    if (findResult.isErr()) {
      return err(findResult.error);
    }

    const order = findResult.value;

    // Idempotent: if already confirmed or further along, return current state
    if (order.status !== OrderStatus.Placed) {
      return ok(order);
    }

    // Update payment info with the confirmed payment intent
    let updated = order.updatePayment({
      status: PaymentStatus.Paid,
      stripePaymentIntentId: input.paymentIntentId,
    });

    // Transition order status from PLACED → CONFIRMED
    updated = updated.confirm();

    return this.orderRepository.save(updated);
  }
}
