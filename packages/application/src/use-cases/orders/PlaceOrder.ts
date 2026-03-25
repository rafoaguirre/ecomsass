import {
  OrderModel,
  NotFoundError,
  ValidationError,
  MoneyVO,
  PaymentStatus,
  ProductAvailability,
  err,
} from '@ecomsaas/domain';
import type {
  CreateOrderInput,
  Result,
  OrderItem,
  PaymentMethod,
  CurrencyCode,
  FulfillmentInfo,
} from '@ecomsaas/domain';
import type { OrderRepository, ProductRepository, StoreRepository } from '../../ports';

/**
 * Input for placing an order.
 * Simplified input that doesn't require the caller to calculate totals.
 */
export interface PlaceOrderInput {
  storeId: string;
  userId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  paymentMethod: PaymentMethod;
  fulfillment?: Partial<FulfillmentInfo>;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * PlaceOrder Use Case
 *
 * Creates a new order for a customer.
 *
 * Business Rules:
 * - Store must exist and be active
 * - All products must exist and belong to the specified store
 * - All products must be available
 * - Order totals are calculated from product prices
 * - Payment is initialized as pending
 *
 * @example
 * ```typescript
 * const placeOrder = new PlaceOrder(orderRepository, productRepository, storeRepository);
 * const result = await placeOrder.execute({
 *   storeId: 'store-123',
 *   userId: 'user-456',
 *   items: [
 *     { productId: 'prod-1', quantity: 2 },
 *     { productId: 'prod-2', quantity: 1 }
 *   ],
 *   paymentMethod: PaymentMethod.Credit
 * });
 *
 * if (result.isOk()) {
 *   const order = result.unwrap();
 *   console.log('Order placed:', order.referenceId);
 * }
 * ```
 */
export class PlaceOrder {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  /**
   * Execute the use case.
   *
   * @param input - PlaceOrderInput containing order details
   * @returns Result with OrderModel if successful, Error if validation fails
   */
  async execute(input: PlaceOrderInput): Promise<Result<OrderModel, Error>> {
    // 1. Verify store exists and is active
    const storeResult = await this.storeRepository.findById(input.storeId);
    if (storeResult.isErr()) {
      return err(new NotFoundError('Store', input.storeId));
    }

    const store = storeResult.value;
    if (!store.isActive) {
      return err(new ValidationError('Store is not active', { field: 'storeId' }));
    }

    // 2. Validate and load all products
    const orderItems: OrderItem[] = [];
    let currency: CurrencyCode | undefined;

    for (const item of input.items) {
      const productResult = await this.productRepository.findById(item.productId);
      if (productResult.isErr()) {
        return err(new NotFoundError('Product', item.productId));
      }

      const product = productResult.value;

      // Verify product belongs to the store
      if (product.storeId !== input.storeId) {
        return err(
          new ValidationError(
            `Product ${item.productId} does not belong to store ${input.storeId}`,
            { field: 'items' }
          )
        );
      }

      // Verify product is available
      if (product.availability !== ProductAvailability.Available) {
        return err(
          new ValidationError(`Product ${product.name} is not available`, { field: 'items' })
        );
      }

      // Ensure all items use the same currency
      if (!currency) {
        currency = product.price.currency;
      } else if (product.price.currency !== currency) {
        return err(
          new ValidationError('All products must use the same currency', { field: 'items' })
        );
      }

      // Calculate line item totals
      const unitPrice = product.price;
      const lineSubtotal = MoneyVO.fromSmallestUnit(unitPrice.amount, unitPrice.currency).multiply(
        item.quantity
      );

      orderItems.push({
        id: this.generateItemId(),
        productId: product.id,
        productName: product.name,
        variantId: item.variantId,
        variantName: undefined, // TODO: Look up variant name if variantId provided
        quantity: item.quantity,
        unitPrice,
        subtotal: lineSubtotal.value(),
        total: lineSubtotal.value(), // No discounts for now
        metadata: {},
      });
    }

    if (orderItems.length === 0) {
      return err(new ValidationError('Order must have at least one item', { field: 'items' }));
    }

    if (!currency) {
      return err(new ValidationError('Unable to determine order currency', { field: 'items' }));
    }

    // 3. Calculate order total
    const subtotal = orderItems.reduce(
      (sum, item) => sum.add(MoneyVO.fromSmallestUnit(item.total.amount, item.total.currency)),
      MoneyVO.zero(currency)
    );

    // 4. Generate reference ID
    const referenceId = await this.orderRepository.generateReferenceId(input.storeId);

    // 5. Create order
    const orderData: CreateOrderInput = {
      id: this.generateOrderId(),
      storeId: input.storeId,
      userId: input.userId,
      referenceId,
      items: orderItems,
      payment: {
        method: input.paymentMethod,
        status: PaymentStatus.Pending,
        amount: subtotal.value(),
      },
      fulfillment: input.fulfillment,
      notes: input.notes
        ? [
            {
              id: this.generateNoteId(),
              targetId: input.userId,
              target: 'buyer',
              note: input.notes,
              createdAt: new Date(),
            },
          ]
        : undefined,
      metadata: input.metadata,
    };

    const order = OrderModel.create(orderData);

    // 6. Persist the order
    return this.orderRepository.save(order);
  }

  /**
   * Generate a unique order ID.
   * In a real implementation, this would use a proper ID generation strategy.
   */
  private generateOrderId(): string {
    return `order-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate a unique order item ID.
   */
  private generateItemId(): string {
    return `item-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate a unique note ID.
   */
  private generateNoteId(): string {
    return `note-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
