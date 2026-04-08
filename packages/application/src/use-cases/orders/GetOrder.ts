import type { OrderModel, Result, NotFoundError } from '@ecomsaas/domain';
import type { OrderRepository } from '../../ports';

export interface GetOrderInput {
  id: string;
  identifierType?: 'id' | 'referenceId';
}

export class GetOrder {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: GetOrderInput): Promise<Result<OrderModel, NotFoundError>> {
    if (input.identifierType === 'referenceId') {
      return this.orderRepository.findByReferenceId(input.id);
    }
    return this.orderRepository.findById(input.id);
  }
}
