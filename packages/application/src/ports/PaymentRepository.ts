import type { Payment, PaymentStatus, Result } from '@ecomsaas/domain';

/**
 * Repository port for the Payment entity.
 *
 * Records individual payment attempts/events as first-class rows.
 * The orders.payment JSONB summary is updated separately via OrderRepository.
 */
export interface PaymentRepository {
  /**
   * Record a new payment attempt/event.
   */
  record(payment: Payment): Promise<Result<Payment, Error>>;

  /**
   * Find all payments for a given order.
   */
  findByOrderId(orderId: string): Promise<Payment[]>;

  /**
   * Update the status of an existing payment record.
   */
  updateStatus(id: string, status: PaymentStatus): Promise<Result<void, Error>>;
}
