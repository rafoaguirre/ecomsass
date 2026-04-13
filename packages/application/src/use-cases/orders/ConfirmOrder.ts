import { PaymentStatus, OrderStatus, err, ok } from '@ecomsaas/domain';
import type { OrderModel, Result } from '@ecomsaas/domain';
import type { OrderRepository } from '../../ports';

export interface ConfirmOrderInput {
  orderId: string;
  paymentIntentId: string;
  /** Amount in smallest currency unit (e.g. cents) as received from the provider. */
  amount: number;
  /** ISO currency code as received from the provider. */
  currency: string;
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

    // Verify the paid amount matches the order total (prevents underpayment attacks)
    if (
      BigInt(input.amount) !== order.total.amount ||
      input.currency.toUpperCase() !== order.total.currency
    ) {
      return err(
        new Error(
          `Payment amount mismatch: expected ${order.total.amount} ${order.total.currency}, ` +
            `received ${input.amount} ${input.currency.toUpperCase()}`
        )
      );
    }

    // Update payment info with the confirmed payment intent
    let updated = order.updatePayment({
      status: PaymentStatus.Paid,
      providerPaymentId: input.paymentIntentId,
    });

    // Transition order status from PLACED → CONFIRMED
    updated = updated.confirm();

    return this.orderRepository.save(updated, OrderStatus.Placed);
  }
}
