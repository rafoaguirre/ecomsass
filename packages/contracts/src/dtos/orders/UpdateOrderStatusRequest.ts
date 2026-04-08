import type { OrderStatus } from '@ecomsaas/domain/enums';

/**
 * Request to update an order's status.
 * Status transitions are validated by the domain model's state machine.
 */
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
}
