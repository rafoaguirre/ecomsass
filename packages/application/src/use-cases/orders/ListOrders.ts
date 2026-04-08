import type { OrderModel, OrderStatus } from '@ecomsaas/domain';
import type { OrderRepository } from '../../ports';

export interface ListOrdersInput {
  storeId?: string;
  userId?: string;
  status?: OrderStatus;
  offset?: number;
  limit?: number;
}

export class ListOrders {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ListOrdersInput): Promise<OrderModel[]> {
    const options = {
      offset: input.offset,
      limit: input.limit,
      status: input.status,
    };

    if (input.storeId) {
      return this.orderRepository.findByStoreId(input.storeId, options);
    }

    if (input.userId) {
      return this.orderRepository.findByUserId(input.userId, options);
    }

    return [];
  }
}
