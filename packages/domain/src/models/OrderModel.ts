import type { Order, OrderItem, PaymentInfo, FulfillmentInfo, OrderNote } from '../entities/Order';
import type { Money } from '../value-objects';
import { MoneyVO } from '../value-objects';
import { OrderStatus, FulfillmentType } from '../enums';
import { AggregateRoot } from '../core';
import { ValidationError, InvariantError } from '../errors';

// ---------------------------------------------------------------------------
// State machine — valid transitions
// ---------------------------------------------------------------------------

/**
 * Order lifecycle state machine.
 *
 * ```
 * Placed → Confirmed | Cancelled
 * Confirmed → Processing | Cancelled
 * Processing → Packed | Cancelled
 * Packed → InTransit | Cancelled
 * InTransit → Delivered
 * Delivered → Refunded | PartiallyRefunded | Completed
 * Refunded → (terminal)
 * PartiallyRefunded → Refunded | Completed
 * Completed → (terminal)
 * Cancelled → (terminal)
 * ```
 */
const VALID_TRANSITIONS = new Map<OrderStatus, ReadonlySet<OrderStatus>>([
  [OrderStatus.Placed, new Set<OrderStatus>([OrderStatus.Confirmed, OrderStatus.Cancelled])],
  [OrderStatus.Confirmed, new Set<OrderStatus>([OrderStatus.Processing, OrderStatus.Cancelled])],
  [OrderStatus.Processing, new Set<OrderStatus>([OrderStatus.Packed, OrderStatus.Cancelled])],
  [OrderStatus.Packed, new Set<OrderStatus>([OrderStatus.InTransit, OrderStatus.Cancelled])],
  [OrderStatus.InTransit, new Set<OrderStatus>([OrderStatus.Delivered])],
  [
    OrderStatus.Delivered,
    new Set<OrderStatus>([
      OrderStatus.Refunded,
      OrderStatus.PartiallyRefunded,
      OrderStatus.Completed,
    ]),
  ],
  [
    OrderStatus.PartiallyRefunded,
    new Set<OrderStatus>([OrderStatus.Refunded, OrderStatus.Completed]),
  ],
]);

// Terminal statuses (no further transitions)
const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.Cancelled,
  OrderStatus.Refunded,
  OrderStatus.Completed,
]);

// ---------------------------------------------------------------------------
// Factory input
// ---------------------------------------------------------------------------

/**
 * Input for creating a new OrderModel via the factory method.
 */
export interface CreateOrderInput {
  id: string;
  storeId: string;
  userId: string;
  referenceId: string;
  items: OrderItem[];
  payment: PaymentInfo;
  fulfillment?: Partial<FulfillmentInfo>;
  notes?: OrderNote[];
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// OrderModel
// ---------------------------------------------------------------------------

/**
 * Rich domain model for Order aggregate root.
 *
 * Implements an order lifecycle state machine with guard and transition
 * methods. All mutations return a new OrderModel instance (immutable).
 * Totals are calculated from line items using MoneyVO arithmetic.
 */
export class OrderModel extends AggregateRoot<Order> implements Order {
  // --- Property accessors (delegate to props) --------------------------------

  get storeId(): string {
    return this.props.storeId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get referenceId(): string {
    return this.props.referenceId;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get items(): OrderItem[] {
    return this.props.items;
  }
  get subtotal(): Money {
    return this.props.subtotal;
  }
  get tax(): Money | undefined {
    return this.props.tax;
  }
  get discount(): Money | undefined {
    return this.props.discount;
  }
  get deliveryFee(): Money | undefined {
    return this.props.deliveryFee;
  }
  get total(): Money {
    return this.props.total;
  }
  get payment(): PaymentInfo {
    return this.props.payment;
  }
  get fulfillment(): FulfillmentInfo {
    return this.props.fulfillment;
  }
  get notes(): OrderNote[] {
    return this.props.notes;
  }
  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Constructor (private) -------------------------------------------------

  private constructor(props: Order) {
    super(props);
    this.validate();
  }

  // ---------------------------------------------------------------------------
  // Factory
  // ---------------------------------------------------------------------------

  /**
   * Create a new OrderModel with calculated totals and sensible defaults.
   */
  static create(input: CreateOrderInput): OrderModel {
    const now = new Date();
    const currency = input.items[0]?.unitPrice.currency;

    if (!currency) {
      throw new ValidationError('Order must have at least one item', {
        field: 'items',
      });
    }

    const subtotal = OrderModel.calculateSubtotalFromItems(input.items, currency);
    const total = OrderModel.calculateTotalFromParts(subtotal, undefined, undefined, undefined);

    return new OrderModel({
      ...input,
      status: OrderStatus.Placed,
      subtotal: subtotal.value(),
      total: total.value(),
      fulfillment: {
        type: input.fulfillment?.type ?? FulfillmentType.Delivery,
        ...input.fulfillment,
      },
      notes: input.notes ?? [],
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute an OrderModel from persisted data.
   */
  static fromData(data: Order): OrderModel {
    return new OrderModel(data);
  }

  // ---------------------------------------------------------------------------
  // Validation (runs in constructor)
  // ---------------------------------------------------------------------------

  private validate(): void {
    if (this.items.length === 0) {
      throw new ValidationError('Order must have at least one item', {
        field: 'items',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Calculation methods (using MoneyVO)
  // ---------------------------------------------------------------------------

  /**
   * Sum of all item totals.
   */
  calculateSubtotal(): MoneyVO {
    return OrderModel.calculateSubtotalFromItems(this.items, this.subtotal.currency);
  }

  /**
   * Calculate the order total: subtotal + tax + deliveryFee - discount.
   */
  calculateTotal(): MoneyVO {
    const subtotalVO = this.calculateSubtotal();
    const taxVO = this.tax
      ? MoneyVO.fromSmallestUnit(this.tax.amount, this.tax.currency)
      : undefined;
    const discountVO = this.discount
      ? MoneyVO.fromSmallestUnit(this.discount.amount, this.discount.currency)
      : undefined;
    const deliveryVO = this.deliveryFee
      ? MoneyVO.fromSmallestUnit(this.deliveryFee.amount, this.deliveryFee.currency)
      : undefined;

    return OrderModel.calculateTotalFromParts(subtotalVO, taxVO, discountVO, deliveryVO);
  }

  /** Total number of units across all line items. */
  itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private static calculateSubtotalFromItems(items: OrderItem[], currency: string): MoneyVO {
    let subtotal = MoneyVO.zero(currency as Money['currency']);
    for (const item of items) {
      subtotal = subtotal.add(MoneyVO.fromSmallestUnit(item.total.amount, item.total.currency));
    }
    return subtotal;
  }

  private static calculateTotalFromParts(
    subtotal: MoneyVO,
    tax?: MoneyVO,
    discount?: MoneyVO,
    deliveryFee?: MoneyVO
  ): MoneyVO {
    let total = subtotal;
    if (tax) {
      total = total.add(tax);
    }
    if (deliveryFee) {
      total = total.add(deliveryFee);
    }
    if (discount) {
      total = total.subtract(discount);
    }
    return total;
  }

  // ---------------------------------------------------------------------------
  // Guard methods (status queries)
  // ---------------------------------------------------------------------------

  /** Whether the order can be cancelled from its current status. */
  canCancel(): boolean {
    const allowed = VALID_TRANSITIONS.get(this.status);
    return allowed?.has(OrderStatus.Cancelled) ?? false;
  }

  /** Whether the order can be refunded (full or partial). */
  canRefund(): boolean {
    const allowed = VALID_TRANSITIONS.get(this.status);
    if (!allowed) return false;
    return allowed.has(OrderStatus.Refunded) || allowed.has(OrderStatus.PartiallyRefunded);
  }

  /** Whether the order can advance to Processing. */
  canFulfill(): boolean {
    const allowed = VALID_TRANSITIONS.get(this.status);
    return allowed?.has(OrderStatus.Processing) ?? false;
  }

  /** Whether the order can advance to InTransit (ship). */
  canShip(): boolean {
    const allowed = VALID_TRANSITIONS.get(this.status);
    return allowed?.has(OrderStatus.InTransit) ?? false;
  }

  /** Whether the order is in a terminal state (no further transitions). */
  isTerminal(): boolean {
    return TERMINAL_STATUSES.has(this.status);
  }

  // ---------------------------------------------------------------------------
  // Transition methods (immutable — return new OrderModel)
  // ---------------------------------------------------------------------------

  /** Transition to Confirmed. */
  confirm(): OrderModel {
    return this.transitionTo(OrderStatus.Confirmed);
  }

  /** Transition to Cancelled. */
  cancel(): OrderModel {
    return this.transitionTo(OrderStatus.Cancelled);
  }

  /** Transition to Processing. */
  markProcessing(): OrderModel {
    return this.transitionTo(OrderStatus.Processing);
  }

  /** Transition to Packed. */
  markPacked(): OrderModel {
    return this.transitionTo(OrderStatus.Packed);
  }

  /** Transition to InTransit with tracking info. */
  markShipped(trackingNumber: string, carrier: string): OrderModel {
    this.assertTransition(OrderStatus.InTransit);
    return this.withUpdates({
      status: OrderStatus.InTransit,
      fulfillment: {
        ...this.fulfillment,
        trackingNumber,
        carrier,
      },
    });
  }

  /** Transition to Delivered. */
  markDelivered(): OrderModel {
    return this.transitionTo(OrderStatus.Delivered);
  }

  /** Transition to Refunded (full refund). */
  refund(): OrderModel {
    return this.transitionTo(OrderStatus.Refunded);
  }

  /** Transition to PartiallyRefunded. */
  partialRefund(): OrderModel {
    return this.transitionTo(OrderStatus.PartiallyRefunded);
  }

  /** Transition to Completed. */
  complete(): OrderModel {
    return this.transitionTo(OrderStatus.Completed);
  }

  // ---------------------------------------------------------------------------
  // Immutable update helpers
  // ---------------------------------------------------------------------------

  /** Add a note to the order. */
  addNote(note: OrderNote): OrderModel {
    return this.withUpdates({ notes: [...this.notes, note] });
  }

  /** Update payment info (e.g. after a successful payment). */
  updatePayment(patch: Partial<PaymentInfo>): OrderModel {
    return this.withUpdates({
      payment: { ...this.payment, ...patch },
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private withUpdates(updates: Partial<Order>): OrderModel {
    return new OrderModel({ ...this.props, ...updates, updatedAt: new Date() });
  }

  private transitionTo(target: OrderStatus): OrderModel {
    this.assertTransition(target);
    return this.withUpdates({ status: target });
  }

  private assertTransition(target: OrderStatus): void {
    const allowed = VALID_TRANSITIONS.get(this.status);
    if (!allowed || !allowed.has(target)) {
      throw new InvariantError(`Invalid order transition: ${this.status} → ${target}`);
    }
  }
}
