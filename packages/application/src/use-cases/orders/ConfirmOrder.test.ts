import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmOrder } from './ConfirmOrder';
import {
  OrderModel,
  NotFoundError,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ok,
  err,
} from '@ecomsaas/domain';
import type { OrderRepository } from '../../ports';

describe('ConfirmOrder Use Case', () => {
  let confirmOrder: ConfirmOrder;
  let mockOrderRepository: OrderRepository;

  const makeOrder = (overrides?: Record<string, unknown>) =>
    OrderModel.create({
      id: 'order-123',
      storeId: 'store-123',
      userId: 'user-789',
      referenceId: 'ORD-001',
      items: [
        {
          id: 'item-1',
          productId: 'prod-123',
          productName: 'Test Product',
          quantity: 2,
          unitPrice: { amount: 1000n, currency: 'USD' },
          subtotal: { amount: 2000n, currency: 'USD' },
          total: { amount: 2000n, currency: 'USD' },
        },
      ],
      payment: {
        method: PaymentMethod.Credit,
        status: PaymentStatus.Pending,
        amount: { amount: 2000n, currency: 'USD' },
      },
      ...overrides,
    });

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      findByReferenceId: vi.fn(),
      findByStoreId: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      generateReferenceId: vi.fn(),
    };

    confirmOrder = new ConfirmOrder(mockOrderRepository);
  });

  it('should confirm a placed order with matching amount', async () => {
    const order = makeOrder();
    vi.mocked(mockOrderRepository.findById).mockResolvedValue(ok(order));
    vi.mocked(mockOrderRepository.save).mockImplementation(async (o) => ok(o));

    const result = await confirmOrder.execute({
      orderId: 'order-123',
      paymentIntentId: 'pi_test',
      amount: 2000,
      currency: 'usd',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe(OrderStatus.Confirmed);
      expect(result.value.payment.status).toBe(PaymentStatus.Paid);
      expect(result.value.payment.providerPaymentId).toBe('pi_test');
    }
    expect(mockOrderRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: OrderStatus.Confirmed }),
      OrderStatus.Placed
    );
  });

  it('should reject when amount does not match', async () => {
    const order = makeOrder();
    vi.mocked(mockOrderRepository.findById).mockResolvedValue(ok(order));

    const result = await confirmOrder.execute({
      orderId: 'order-123',
      paymentIntentId: 'pi_test',
      amount: 500, // wrong
      currency: 'usd',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('Payment amount mismatch');
    }
    expect(mockOrderRepository.save).not.toHaveBeenCalled();
  });

  it('should reject when currency does not match', async () => {
    const order = makeOrder();
    vi.mocked(mockOrderRepository.findById).mockResolvedValue(ok(order));

    const result = await confirmOrder.execute({
      orderId: 'order-123',
      paymentIntentId: 'pi_test',
      amount: 2000,
      currency: 'eur', // wrong
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('Payment amount mismatch');
    }
    expect(mockOrderRepository.save).not.toHaveBeenCalled();
  });

  it('should be idempotent for already-confirmed orders', async () => {
    const order = makeOrder();
    const confirmed = order
      .updatePayment({ status: PaymentStatus.Paid, providerPaymentId: 'pi_test' })
      .confirm();
    vi.mocked(mockOrderRepository.findById).mockResolvedValue(ok(confirmed));

    const result = await confirmOrder.execute({
      orderId: 'order-123',
      paymentIntentId: 'pi_test',
      amount: 2000,
      currency: 'usd',
    });

    expect(result.isOk()).toBe(true);
    expect(mockOrderRepository.save).not.toHaveBeenCalled();
  });

  it('should return error when order not found', async () => {
    vi.mocked(mockOrderRepository.findById).mockResolvedValue(
      err(new NotFoundError('Order', 'order-123'))
    );

    const result = await confirmOrder.execute({
      orderId: 'order-123',
      paymentIntentId: 'pi_test',
      amount: 2000,
      currency: 'usd',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundError);
    }
  });
});
