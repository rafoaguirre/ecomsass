import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProduct } from './CreateProduct';
import {
  StoreModel,
  ProductModel,
  NotFoundError,
  ValidationError,
  StoreType,
  ok,
  err,
} from '@ecomsaas/domain';
import type { CreateProductInput } from '@ecomsaas/domain';
import type { ProductRepository, StoreRepository } from '../../ports';

describe('CreateProduct Use Case', () => {
  let createProduct: CreateProduct;
  let mockProductRepository: ProductRepository;
  let mockStoreRepository: StoreRepository;

  const mockStoreData = {
    id: 'store-123',
    vendorProfileId: 'vendor-456',
    name: 'Test Store',
    slug: 'test-store',
    storeType: StoreType.General,
  };

  const mockProductInput: CreateProductInput = {
    id: 'prod-123',
    storeId: 'store-123',
    name: 'Test Product',
    slug: 'test-product',
    price: { amount: 1999n, currency: 'USD' },
  };

  beforeEach(() => {
    mockProductRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByStoreId: vi.fn(),
      findByCategoryId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
      searchActive: vi.fn(),
      reserveStock: vi.fn(),
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

    createProduct = new CreateProduct(mockProductRepository, mockStoreRepository);
  });

  describe('execute', () => {
    it('should create a product successfully', async () => {
      const mockStore = StoreModel.create(mockStoreData);
      const mockProduct = ProductModel.create(mockProductInput);

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.slugExists).mockResolvedValue(false);
      vi.mocked(mockProductRepository.save).mockResolvedValue(ok(mockProduct));

      const result = await createProduct.execute(mockProductInput);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe('Test Product');
      }
      expect(mockStoreRepository.findById).toHaveBeenCalledWith('store-123');
      expect(mockProductRepository.slugExists).toHaveBeenCalledWith('store-123', 'test-product');
      expect(mockProductRepository.save).toHaveBeenCalled();
    });

    it('should fail when store does not exist', async () => {
      const notFoundError = new NotFoundError('Store', 'store-123');
      vi.mocked(mockStoreRepository.findById).mockResolvedValue(err(notFoundError));

      const result = await createProduct.execute(mockProductInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain('not found');
      }
      expect(mockProductRepository.slugExists).not.toHaveBeenCalled();
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when product slug already exists in the store', async () => {
      const mockStore = StoreModel.create(mockStoreData);

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.slugExists).mockResolvedValue(true);

      const result = await createProduct.execute(mockProductInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('already taken');
      }
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when product model validation fails', async () => {
      const mockStore = StoreModel.create(mockStoreData);
      const invalidInput = {
        ...mockProductInput,
        name: '', // Empty name should fail validation
      };

      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));
      vi.mocked(mockProductRepository.slugExists).mockResolvedValue(false);

      const result = await createProduct.execute(invalidInput);

      expect(result.isErr()).toBe(true);
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });
  });
});
