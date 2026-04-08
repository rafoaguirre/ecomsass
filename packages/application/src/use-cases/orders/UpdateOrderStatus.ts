import { InvariantError, err } from '@ecomsaas/domain';
import type { OrderModel, OrderStatus, Result } from '@ecomsaas/domain';
import type { OrderRepository } from '../../ports';

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
}

export class UpdateOrderStatus {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: UpdateOrderStatusInput): Promise<Result<OrderModel, Error>> {
    const findResult = await this.orderRepository.findById(input.orderId);
    if (findResult.isErr()) {
      return err(findResult.error);
    }

    let order = findResult.value;

    try {
      order = this.applyTransition(order, input);
    } catch (error) {
      if (error instanceof Error) {
        return err(new InvariantError(error.message));
      }
      return err(new InvariantError('Failed to update order status'));
    }

    return this.orderRepository.save(order);
  }

  private applyTransition(order: OrderModel, input: UpdateOrderStatusInput): OrderModel {
    const transitionMap: Record<string, () => OrderModel> = {
      CONFIRMED: () => order.confirm(),
      CANCELLED: () => order.cancel(),
      PROCESSING: () => order.markProcessing(),
      PACKED: () => order.markPacked(),
      IN_TRANSIT: () => order.markShipped(input.trackingNumber ?? '', input.carrier ?? ''),
      DELIVERED: () => order.markDelivered(),
      REFUNDED: () => order.refund(),
      PARTIALLY_REFUNDED: () => order.partialRefund(),
      COMPLETED: () => order.complete(),
    };

    const transition = transitionMap[input.status];
    if (!transition) {
      throw new InvariantError(`Unsupported status transition to: ${input.status}`);
    }

    return transition();
  }
}
