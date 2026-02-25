import type { Order } from '@ecomsaas/domain/entities';

/**
 * Order response with additional fields
 */
export interface OrderResponse extends Order {
  storeName: string;
  customerName: string;
  itemCount: number;
}

/**
 * Order summary for lists
 */
export interface OrderSummary {
  id: string;
  referenceId: string;
  status: string;
  total: {
    amount: string;
    currency: string;
  };
  itemCount: number;
  createdAt: string;
}
