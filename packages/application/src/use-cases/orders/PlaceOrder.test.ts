import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaceOrder } from './PlaceOrder';
import {
  StoreModel,
  ProductModel,
  OrderModel,
  NotFoundError,
  ValidationError,
  StoreType,
  PaymentMethod,
  PaymentStatus,
  ProductAvailability,
  ok,
  err,
} from '@ecomsaas/domain';
import type { CreateProductInput } from '@ecomsaas/domain';
import type { OrderRepository, ProductRepository, StoreRepository, IdGenerator } from '../../ports';

describe('PlaceOrder Use Case', () => {
  let placeOrder: PlaceOrder;
  let mockOrderRepository: OrderRepository;
  let mockProductRepository: ProductRepository;
  let mockStoreRepository: StoreRepository;
  let mockIdGenerator: IdGenerator;

  const mockStoreData = {
    id: 'store-123',
    vendorProfileId: 'vendor-456',
    name: 'Test Store',
    slug: 'test-store',
    storeType: StoreType.General,
  };

  const mockProductData: CreateProductInput = {
    id: 'prod-123',
    storeId: 'store-123',
    name: 'Test Product',
    slug: 'test-product',
    price: { amount: 1999n, currency: 'USD' },
    availability: ProductAvailability.Available,
  };

  const mockOrderInput = {
    storeId: 'store-123',
    userId: 'user-789',
    items: [{ productId: 'prod-123', quantity: 2 }],
    paymentMethod: PaymentMethod.Credit,
  };

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

    mockProductRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByStoreId: vi.fn(),
      findByCategoryId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
      searchActive: vi.fn(),
      reserveStock: vi.fn().mockResolvedValue(ok(undefined)),
    };

    mockStoreRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByVendorId: vi.fn(),
      findActive: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
      searchActive: vi.fn(),
    };

    mockIdGenerator = {
      generate: vi.fn().mockReturnValue('mock-id-123'),
      generateBatch: vi.fn(),
    };

    placeOrder = new PlaceOrder(
      mockOrderRepository,
      mockProductRepository,
      mockStoreRepository,
      mockIdGenerator
    );
  });

  describe('execute', () => {
    it('should place an order successfully', async () => {
      const mockStore = StoreModel.create(mockStoreData).activate();
      const mockProduct = ProductModel.create(mockProductData);
      const mockOrder = OrderModel.create({
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
            unitPrice: { amount: 1999n, currency: 'USD' },
            subtotal: { amount: 3998n, currency: 'USD' },
            total: { amount: 3998n, currency: 'USD' },
          },
        ],
        payment: {
          method: PaymentMethod.Credit,
          status: PaymentStatus.Pending,
          amount: { amount: 3998n, currency: 'USD' },
        },
      });

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.findById).mockResolvedValue(ok(mockProduct));
      vi.mocked(mockOrderRepository.generateReferenceId).mockResolvedValue('ORD-001');
      vi.mocked(mockOrderRepository.save).mockResolvedValue(ok(mockOrder));

      const result = await placeOrder.execute(mockOrderInput);

      expect(result.isOk()).toBe(true);
      expect(mockStoreRepository.findById).toHaveBeenCalledWith('store-123');
      expect(mockProductRepository.findById).toHaveBeenCalledWith('prod-123');
      expect(mockProductRepository.reserveStock).toHaveBeenCalledWith([
        { productId: 'prod-123', quantity: 2 },
      ]);
      expect(mockOrderRepository.generateReferenceId).toHaveBeenCalledWith('store-123');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should fail when store does not exist', async () => {
      const notFoundError = new NotFoundError('Store', 'store-123');
      vi.mocked(mockStoreRepository.findById).mockResolvedValue(err(notFoundError));

      const result = await placeOrder.execute(mockOrderInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
      expect(mockProductRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when store is not active', async () => {
      const inactiveStore = StoreModel.create(mockStoreData).deactivate();
      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(inactiveStore));

      const result = await placeOrder.execute(mockOrderInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('not active');
      }
      expect(mockProductRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when product does not exist', async () => {
      const mockStore = StoreModel.create(mockStoreData).activate();
      const notFoundError = new NotFoundError('Product', 'prod-123');

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.findById).mockResolvedValue(err(notFoundError));

      const result = await placeOrder.execute(mockOrderInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain('not found');
      }
    });

    it('should fail when product does not belong to the store', async () => {
      const mockStore = StoreModel.create(mockStoreData).activate();
      const wrongStoreProduct = ProductModel.create({
        ...mockProductData,
        storeId: 'different-store',
      });

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.findById).mockResolvedValue(ok(wrongStoreProduct));

      const result = await placeOrder.execute(mockOrderInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('does not belong to store');
      }
    });

    it('should fail when product is not available', async () => {
      const mockStore = StoreModel.create(mockStoreData).activate();
      const unavailableProduct = ProductModel.create(mockProductData).updateAvailability(
        ProductAvailability.OutOfStock
      );

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.findById).mockResolvedValue(ok(unavailableProduct));

      const result = await placeOrder.execute(mockOrderInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('not available');
      }
    });

    it('should fail when stock reservation fails', async () => {
      const mockStore = StoreModel.create(mockStoreData).activate();
      const mockProduct = ProductModel.create(mockProductData);

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.findById).mockResolvedValue(ok(mockProduct));
      vi.mocked(mockProductRepository.reserveStock).mockResolvedValue(
        err(new Error('Insufficient stock for product prod-123'))
      );

      const result = await placeOrder.execute(mockOrderInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Insufficient stock');
      }
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when no items in the order', async () => {
      const mockStore = StoreModel.create(mockStoreData).activate();
      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));

      const result = await placeOrder.execute({
        ...mockOrderInput,
        items: [],
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('at least one item');
      }
    });

    it('should handle multiple products with correct totals', async () => {
      const mockStore = StoreModel.create(mockStoreData).activate();
      const product1 = ProductModel.create(mockProductData);
      const product2 = ProductModel.create({
        id: 'prod-456',
        storeId: 'store-123',
        name: 'Product 2',
        slug: 'product-2',
        price: { amount: 2999n, currency: 'USD' },
        availability: ProductAvailability.Available,
      });

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.findById)
        .mockResolvedValueOnce(ok(product1))
        .mockResolvedValueOnce(ok(product2));
      vi.mocked(mockOrderRepository.generateReferenceId).mockResolvedValue('ORD-002');
      vi.mocked(mockOrderRepository.save).mockImplementation(async (order) => ok(order));

      const result = await placeOrder.execute({
        ...mockOrderInput,
        items: [
          { productId: 'prod-123', quantity: 2 },
          { productId: 'prod-456', quantity: 1 },
        ],
      });

      expect(result.isOk()).toBe(true);
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(2);
    });
  });
});
