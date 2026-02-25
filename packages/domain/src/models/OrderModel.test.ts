import { describe, expect, it } from 'vitest';

import { OrderModel } from './OrderModel';
import type { CreateOrderInput } from './OrderModel';
import type { OrderItem, PaymentInfo, OrderNote } from '../entities/Order';
import type { Money } from '../value-objects';
import { OrderStatus, PaymentMethod, PaymentStatus, FulfillmentType } from '../enums';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const usd = (cents: number): Money => ({
  amount: BigInt(cents),
  currency: 'USD',
});

const makeItem = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 'item-1',
  productId: 'prod-1',
  productName: 'Widget',
  quantity: 2,
  unitPrice: usd(1000),
  subtotal: usd(2000),
  total: usd(2000),
  ...overrides,
});

const makePayment = (overrides: Partial<PaymentInfo> = {}): PaymentInfo => ({
  method: PaymentMethod.Card,
  status: PaymentStatus.Paid,
  amount: usd(2000),
  ...overrides,
});

const validInput: CreateOrderInput = {
  id: 'order-1',
  storeId: 'store-1',
  userId: 'user-1',
  referenceId: 'REF-001',
  items: [makeItem()],
  payment: makePayment(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OrderModel', () => {
  // ---------------------------------------------------------------------------
  // Factory — create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create with defaults and Placed status', () => {
      const order = OrderModel.create(validInput);

      expect(order.id).toBe('order-1');
      expect(order.storeId).toBe('store-1');
      expect(order.userId).toBe('user-1');
      expect(order.referenceId).toBe('REF-001');
      expect(order.status).toBe(OrderStatus.Placed);
      expect(order.items).toHaveLength(1);
      expect(order.notes).toEqual([]);
      expect(order.metadata).toEqual({});
      expect(order.fulfillment.type).toBe(FulfillmentType.Delivery);
      expect(order.createdAt).toBeInstanceOf(Date);
    });

    it('should calculate subtotal from items', () => {
      const order = OrderModel.create({
        ...validInput,
        items: [makeItem({ id: 'a', total: usd(1000) }), makeItem({ id: 'b', total: usd(2500) })],
      });
      expect(order.subtotal.amount).toBe(3500n);
    });

    it('should set total equal to subtotal when no tax/discount/delivery', () => {
      const order = OrderModel.create(validInput);
      expect(order.total.amount).toBe(order.subtotal.amount);
    });

    it('should accept custom fulfillment type', () => {
      const order = OrderModel.create({
        ...validInput,
        fulfillment: { type: FulfillmentType.Pickup },
      });
      expect(order.fulfillment.type).toBe(FulfillmentType.Pickup);
    });

    it('should reject empty items', () => {
      expect(() => OrderModel.create({ ...validInput, items: [] })).toThrow('at least one item');
    });
  });

  // ---------------------------------------------------------------------------
  // Factory — fromData
  // ---------------------------------------------------------------------------

  describe('fromData', () => {
    it('should reconstitute from raw data', () => {
      const data = OrderModel.create(validInput).toData();
      const order = OrderModel.fromData(data);
      expect(order.id).toBe(data.id);
      expect(order.status).toBe(data.status);
    });

    it('should reject reconstitution with empty items', () => {
      const data = OrderModel.create(validInput).toData();
      expect(() => OrderModel.fromData({ ...data, items: [] })).toThrow('at least one item');
    });
  });

  // ---------------------------------------------------------------------------
  // Calculation methods
  // ---------------------------------------------------------------------------

  describe('calculateSubtotal', () => {
    it('should sum item totals', () => {
      const order = OrderModel.create({
        ...validInput,
        items: [
          makeItem({ id: 'a', total: usd(1500) }),
          makeItem({ id: 'b', total: usd(2500) }),
          makeItem({ id: 'c', total: usd(500) }),
        ],
      });
      expect(order.calculateSubtotal().amount).toBe(4500n);
    });

    it('should return zero for single zero-value item', () => {
      const order = OrderModel.create({
        ...validInput,
        items: [makeItem({ total: usd(0) })],
      });
      expect(order.calculateSubtotal().amount).toBe(0n);
    });
  });

  describe('calculateTotal', () => {
    it('should equal subtotal when no extras', () => {
      const order = OrderModel.create(validInput);
      expect(order.calculateTotal().amount).toBe(order.calculateSubtotal().amount);
    });

    it('should add tax and delivery, subtract discount', () => {
      const data = OrderModel.create(validInput).toData();
      const order = OrderModel.fromData({
        ...data,
        tax: usd(200),
        deliveryFee: usd(500),
        discount: usd(100),
      });
      // subtotal (2000) + tax (200) + delivery (500) - discount (100) = 2600
      expect(order.calculateTotal().amount).toBe(2600n);
    });
  });

  describe('itemCount', () => {
    it('should sum quantities across items', () => {
      const order = OrderModel.create({
        ...validInput,
        items: [makeItem({ id: 'a', quantity: 2 }), makeItem({ id: 'b', quantity: 3 })],
      });
      expect(order.itemCount()).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // Guard methods
  // ---------------------------------------------------------------------------

  describe('canCancel', () => {
    it('should return true for Placed', () => {
      const order = OrderModel.create(validInput);
      expect(order.canCancel()).toBe(true);
    });

    it('should return true for Confirmed', () => {
      const order = OrderModel.create(validInput).confirm();
      expect(order.canCancel()).toBe(true);
    });

    it('should return true for Processing', () => {
      const order = OrderModel.create(validInput).confirm().markProcessing();
      expect(order.canCancel()).toBe(true);
    });

    it('should return true for Packed', () => {
      const order = OrderModel.create(validInput).confirm().markProcessing().markPacked();
      expect(order.canCancel()).toBe(true);
    });

    it('should return false for InTransit', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('TRACK-1', 'FedEx');
      expect(order.canCancel()).toBe(false);
    });

    it('should return false for Delivered', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('TRACK-1', 'FedEx')
        .markDelivered();
      expect(order.canCancel()).toBe(false);
    });

    it('should return false for already Cancelled', () => {
      const order = OrderModel.create(validInput).cancel();
      expect(order.canCancel()).toBe(false);
    });
  });

  describe('canRefund', () => {
    it('should return false for Placed', () => {
      const order = OrderModel.create(validInput);
      expect(order.canRefund()).toBe(false);
    });

    it('should return true for Delivered', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('TRACK-1', 'FedEx')
        .markDelivered();
      expect(order.canRefund()).toBe(true);
    });

    it('should return true for PartiallyRefunded', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('TRACK-1', 'FedEx')
        .markDelivered()
        .partialRefund();
      expect(order.canRefund()).toBe(true);
    });

    it('should return false for Refunded', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('TRACK-1', 'FedEx')
        .markDelivered()
        .refund();
      expect(order.canRefund()).toBe(false);
    });
  });

  describe('canFulfill', () => {
    it('should return true for Confirmed', () => {
      const order = OrderModel.create(validInput).confirm();
      expect(order.canFulfill()).toBe(true);
    });

    it('should return false for Placed', () => {
      const order = OrderModel.create(validInput);
      expect(order.canFulfill()).toBe(false);
    });
  });

  describe('canShip', () => {
    it('should return true for Packed', () => {
      const order = OrderModel.create(validInput).confirm().markProcessing().markPacked();
      expect(order.canShip()).toBe(true);
    });

    it('should return false for Processing', () => {
      const order = OrderModel.create(validInput).confirm().markProcessing();
      expect(order.canShip()).toBe(false);
    });
  });

  describe('isTerminal', () => {
    it('should return true for Cancelled', () => {
      expect(OrderModel.create(validInput).cancel().isTerminal()).toBe(true);
    });

    it('should return true for Refunded', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .refund();
      expect(order.isTerminal()).toBe(true);
    });

    it('should return true for Completed', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .complete();
      expect(order.isTerminal()).toBe(true);
    });

    it('should return false for Placed', () => {
      expect(OrderModel.create(validInput).isTerminal()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Valid state transitions
  // ---------------------------------------------------------------------------

  describe('valid transitions', () => {
    it('Placed → Confirmed', () => {
      const order = OrderModel.create(validInput).confirm();
      expect(order.status).toBe(OrderStatus.Confirmed);
    });

    it('Placed → Cancelled', () => {
      const order = OrderModel.create(validInput).cancel();
      expect(order.status).toBe(OrderStatus.Cancelled);
    });

    it('Confirmed → Processing', () => {
      const order = OrderModel.create(validInput).confirm().markProcessing();
      expect(order.status).toBe(OrderStatus.Processing);
    });

    it('Confirmed → Cancelled', () => {
      const order = OrderModel.create(validInput).confirm().cancel();
      expect(order.status).toBe(OrderStatus.Cancelled);
    });

    it('Processing → Packed', () => {
      const order = OrderModel.create(validInput).confirm().markProcessing().markPacked();
      expect(order.status).toBe(OrderStatus.Packed);
    });

    it('Processing → Cancelled', () => {
      const order = OrderModel.create(validInput).confirm().markProcessing().cancel();
      expect(order.status).toBe(OrderStatus.Cancelled);
    });

    it('Packed → InTransit (with tracking)', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('TRACK-123', 'FedEx');
      expect(order.status).toBe(OrderStatus.InTransit);
      expect(order.fulfillment.trackingNumber).toBe('TRACK-123');
      expect(order.fulfillment.carrier).toBe('FedEx');
    });

    it('Packed → Cancelled', () => {
      const order = OrderModel.create(validInput).confirm().markProcessing().markPacked().cancel();
      expect(order.status).toBe(OrderStatus.Cancelled);
    });

    it('InTransit → Delivered', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered();
      expect(order.status).toBe(OrderStatus.Delivered);
    });

    it('Delivered → Refunded', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .refund();
      expect(order.status).toBe(OrderStatus.Refunded);
    });

    it('Delivered → PartiallyRefunded', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .partialRefund();
      expect(order.status).toBe(OrderStatus.PartiallyRefunded);
    });

    it('Delivered → Completed', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .complete();
      expect(order.status).toBe(OrderStatus.Completed);
    });

    it('PartiallyRefunded → Refunded', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .partialRefund()
        .refund();
      expect(order.status).toBe(OrderStatus.Refunded);
    });

    it('PartiallyRefunded → Completed', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .partialRefund()
        .complete();
      expect(order.status).toBe(OrderStatus.Completed);
    });

    it('full happy path: Placed → Confirmed → Processing → Packed → InTransit → Delivered → Completed', () => {
      const order = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('TRACK-999', 'UPS')
        .markDelivered()
        .complete();
      expect(order.status).toBe(OrderStatus.Completed);
      expect(order.isTerminal()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid state transitions
  // ---------------------------------------------------------------------------

  describe('invalid transitions', () => {
    it('Placed → Processing (must confirm first)', () => {
      expect(() => OrderModel.create(validInput).markProcessing()).toThrow(
        'Invalid order transition'
      );
    });

    it('Placed → Delivered', () => {
      expect(() => OrderModel.create(validInput).markDelivered()).toThrow(
        'Invalid order transition'
      );
    });

    it('Placed → Refunded', () => {
      expect(() => OrderModel.create(validInput).refund()).toThrow('Invalid order transition');
    });

    it('InTransit → Cancelled (too late)', () => {
      const shipped = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C');
      expect(() => shipped.cancel()).toThrow('Invalid order transition');
    });

    it('Cancelled → Confirmed (terminal)', () => {
      const cancelled = OrderModel.create(validInput).cancel();
      expect(() => cancelled.confirm()).toThrow('Invalid order transition');
    });

    it('Refunded → anything (terminal)', () => {
      const refunded = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .refund();
      expect(() => refunded.confirm()).toThrow('Invalid order transition');
      expect(() => refunded.cancel()).toThrow('Invalid order transition');
    });

    it('Completed → anything (terminal)', () => {
      const completed = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered()
        .complete();
      expect(() => completed.refund()).toThrow('Invalid order transition');
    });

    it('Delivered → Cancelled', () => {
      const delivered = OrderModel.create(validInput)
        .confirm()
        .markProcessing()
        .markPacked()
        .markShipped('T', 'C')
        .markDelivered();
      expect(() => delivered.cancel()).toThrow('Invalid order transition');
    });
  });

  // ---------------------------------------------------------------------------
  // Immutability
  // ---------------------------------------------------------------------------

  describe('immutability', () => {
    it('transitions should not modify original', () => {
      const placed = OrderModel.create(validInput);
      const confirmed = placed.confirm();
      expect(placed.status).toBe(OrderStatus.Placed);
      expect(confirmed.status).toBe(OrderStatus.Confirmed);
    });

    it('markShipped should not modify original fulfillment', () => {
      const packed = OrderModel.create(validInput).confirm().markProcessing().markPacked();
      const shipped = packed.markShipped('TRACK-1', 'FedEx');
      expect(packed.fulfillment.trackingNumber).toBeUndefined();
      expect(shipped.fulfillment.trackingNumber).toBe('TRACK-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Miscellaneous
  // ---------------------------------------------------------------------------

  describe('addNote', () => {
    it('should add a note to the order', () => {
      const order = OrderModel.create(validInput);
      const note: OrderNote = {
        id: 'note-1',
        targetId: 'store-1',
        target: 'store',
        note: 'Handle with care',
        createdAt: new Date(),
      };
      const updated = order.addNote(note);
      expect(updated.notes).toHaveLength(1);
      expect(updated.notes[0]?.note).toBe('Handle with care');
      expect(order.notes).toHaveLength(0); // original unchanged
    });
  });

  describe('toData', () => {
    it('should return a plain object conforming to Order interface', () => {
      const order = OrderModel.create(validInput);
      const data = order.toData();
      expect(data.id).toBe('order-1');
      expect(data.status).toBe(OrderStatus.Placed);
      expect(data.items).toHaveLength(1);
    });
  });
});
