import { PaymentStatus, err } from '@ecomsaas/domain';
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
 */
export class ConfirmOrder {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ConfirmOrderInput): Promise<Result<OrderModel, Error>> {
    const findResult = await this.orderRepository.findById(input.orderId);
    if (findResult.isErr()) {
      return err(findResult.error);
    }

    let order = findResult.value;

    // Update payment info with the confirmed payment intent
    order = order.updatePayment({
      status: PaymentStatus.Paid,
      stripePaymentIntentId: input.paymentIntentId,
    });

    // Transition order status from PLACED → CONFIRMED
    order = order.confirm();

    return this.orderRepository.save(order);
  }
}
