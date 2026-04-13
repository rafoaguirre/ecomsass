import type { ProductRepository } from '@ecomsaas/application/ports';
import type { CreateProduct, GetProduct, UpdateProduct } from '@ecomsaas/application/use-cases';
import type { Storage } from '@ecomsaas/infrastructure/storage';
import { ForbiddenException } from '@nestjs/common';
import { NotFoundError, ProductAvailability, ProductModel, ok, err } from '@ecomsaas/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OwnershipVerifier } from '../common/authorization/ownership-verifier';
import { ProductsService } from './products.service';

const baseProductInput = {
  id: 'prod-0001',
  storeId: 'store-0001',
  name: 'Widget',
  slug: 'widget',
  price: { amount: BigInt(1000), currency: 'CAD' as const },
  availability: ProductAvailability.Available,
  images: [],
  tags: [],
  metadata: {},
};

describe('ProductsService', () => {
  const vendorUser = { id: 'vendor-1', email: 'v@test.com', role: 'Vendor' as const };
  const adminUser = { id: 'admin-1', email: 'a@test.com', role: 'Admin' as const };
  const otherVendor = { id: 'vendor-2', email: 'v2@test.com', role: 'Vendor' as const };

  let service: ProductsService;
  let getProductUC: GetProduct;
  let createProductUC: CreateProduct;
  let updateProductUC: UpdateProduct;
  let productRepository: ProductRepository;
  let ownership: OwnershipVerifier;
  let storage: Storage;

  beforeEach(() => {
    getProductUC = { execute: vi.fn() } as unknown as GetProduct;
    createProductUC = { execute: vi.fn() } as unknown as CreateProduct;
    updateProductUC = { execute: vi.fn() } as unknown as UpdateProduct;
    productRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByStoreId: vi.fn(),
      findByCategoryId: vi.fn(),
      searchActive: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
    } as unknown as ProductRepository;
    ownership = {
      resolveVendorProfileId: vi.fn().mockResolvedValue('vendor-1'),
      verifyStoreOwnership: vi.fn().mockResolvedValue(undefined),
      assertStoreOwnership: vi.fn().mockResolvedValue(undefined),
      verifyProductOwnership: vi.fn().mockResolvedValue(undefined),
      assertOrderAccess: vi.fn().mockResolvedValue(undefined),
    } as unknown as OwnershipVerifier;
    storage = {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      getSignedUrl: vi.fn(),
    } as unknown as Storage;

    service = new ProductsService(
      getProductUC,
      createProductUC,
      updateProductUC,
      productRepository,
      ownership,
      storage
    );
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns product response on success', async () => {
      const product = ProductModel.create({
        ...baseProductInput,
        id: 'prod-uuid-0001',
        name: 'Widget',
      });
      vi.mocked(getProductUC.execute).mockResolvedValue(ok(product));

      const result = await service.getById('prod-uuid-0001');

      expect(result.name).toBe('Widget');
      expect(getProductUC.execute).toHaveBeenCalledWith({
        identifier: 'prod-uuid-0001',
        identifierType: 'id',
      });
    });

    it('throws when product not found', async () => {
      vi.mocked(getProductUC.execute).mockResolvedValue(
        err(new NotFoundError('Product', 'missing-id'))
      );

      await expect(service.getById('missing-id')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createRequest = {
      storeId: 'store-uuid-0001',
      name: 'New Widget',
      price: { amount: 1999, currency: 'CAD' },
      availability: ProductAvailability.Available,
    };

    it('creates product when vendor owns the store', async () => {
      const product = ProductModel.create({
        ...baseProductInput,
        name: 'New Widget',
        storeId: 'store-uuid-0001',
      });
      vi.mocked(createProductUC.execute).mockResolvedValue(ok(product));

      const result = await service.create(createRequest as any, vendorUser);

      expect(result.name).toBe('New Widget');
      expect(ownership.verifyStoreOwnership).toHaveBeenCalledWith('store-uuid-0001', vendorUser);
      expect(createProductUC.execute).toHaveBeenCalled();
    });

    it('throws Forbidden when vendor does not own the store', async () => {
      vi.mocked(ownership.verifyStoreOwnership).mockRejectedValueOnce(
        new ForbiddenException('You do not own this store')
      );

      await expect(service.create(createRequest as any, otherVendor)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('allows Admin to create product in any store', async () => {
      const product = ProductModel.create({ ...baseProductInput, name: 'Admin Widget' });
      vi.mocked(createProductUC.execute).mockResolvedValue(ok(product));

      const result = await service.create(createRequest as any, adminUser);

      expect(result.name).toBe('Admin Widget');
      expect(ownership.verifyStoreOwnership).toHaveBeenCalledWith('store-uuid-0001', adminUser);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates product when vendor owns it', async () => {
      const updated = ProductModel.create({ ...baseProductInput, id: 'prod-1', name: 'Updated' });

      vi.mocked(updateProductUC.execute).mockResolvedValue(ok(updated));

      const result = await service.update('prod-1', { name: 'Updated' } as any, vendorUser);

      expect(result.name).toBe('Updated');
      expect(ownership.verifyProductOwnership).toHaveBeenCalledWith(
        'prod-1',
        vendorUser,
        productRepository
      );
    });

    it('throws Forbidden when vendor does not own the product', async () => {
      vi.mocked(ownership.verifyProductOwnership).mockRejectedValueOnce(
        new ForbiddenException('You do not own this product')
      );

      await expect(service.update('prod-1', {} as any, otherVendor)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('allows Admin to update any product', async () => {
      const updated = ProductModel.create({
        ...baseProductInput,
        id: 'prod-1',
        name: 'Admin Update',
      });
      vi.mocked(updateProductUC.execute).mockResolvedValue(ok(updated));

      const result = await service.update('prod-1', { name: 'Admin Update' } as any, adminUser);

      expect(result.name).toBe('Admin Update');
      expect(ownership.verifyProductOwnership).toHaveBeenCalledWith(
        'prod-1',
        adminUser,
        productRepository
      );
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes product when vendor owns it', async () => {
      vi.mocked(productRepository.delete).mockResolvedValue(ok(undefined));

      await expect(service.remove('prod-1', vendorUser)).resolves.toBeUndefined();
      expect(ownership.verifyProductOwnership).toHaveBeenCalledWith(
        'prod-1',
        vendorUser,
        productRepository
      );
    });

    it('throws Forbidden when removing product of another vendor', async () => {
      vi.mocked(ownership.verifyProductOwnership).mockRejectedValueOnce(
        new ForbiddenException('You do not own this product')
      );

      await expect(service.remove('prod-1', otherVendor)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('propagates not-found error', async () => {
      vi.mocked(ownership.verifyProductOwnership).mockRejectedValueOnce(
        new NotFoundError('Product', 'missing')
      );

      await expect(service.remove('missing', vendorUser)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ── listByStore ────────────────────────────────────────────────────────────

  describe('listByStore', () => {
    it('returns product list response', async () => {
      const products = [
        ProductModel.create({ ...baseProductInput, id: 'prod-A', slug: 'product-a', name: 'A' }),
        ProductModel.create({ ...baseProductInput, id: 'prod-B', slug: 'product-b', name: 'B' }),
      ];
      vi.mocked(productRepository.findByStoreId).mockResolvedValue(products);

      const result = await service.listByStore('store-1', { limit: 10, offset: 0 });

      expect(result.products).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });
  });

  // ── getPresignedUploadUrl ──────────────────────────────────────────────────

  describe('getPresignedUploadUrl', () => {
    it('generates key and returns signed URL', async () => {
      vi.mocked(storage.getSignedUrl).mockResolvedValue('https://s3.example.com/signed');

      const result = await service.getPresignedUploadUrl('image/png', 'photo.png');

      expect(result.key).toMatch(/^products\/.+\.png$/);
      expect(result.uploadUrl).toBe('https://s3.example.com/signed');
    });
  });

  // ── search ─────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('returns paginated product summaries', async () => {
      const product = ProductModel.fromData({
        ...baseProductInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(productRepository.searchActive).mockResolvedValue({
        data: [product],
        total: 1,
      });

      const result = await service.search({ q: 'widget' });

      expect(result.products).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(productRepository.searchActive).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'widget' })
      );
    });

    it('passes all filters through to repository', async () => {
      vi.mocked(productRepository.searchActive).mockResolvedValue({ data: [], total: 0 });

      await service.search({
        q: 'test',
        storeId: 'store-1',
        categoryId: 'cat-1',
        availability: ProductAvailability.Available,
        minPrice: 100,
        maxPrice: 5000,
        sortBy: 'price',
        sortDirection: 'asc',
        offset: 20,
        limit: 10,
      });

      expect(productRepository.searchActive).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'test',
          storeId: 'store-1',
          categoryId: 'cat-1',
          minPrice: 100,
          maxPrice: 5000,
          sortBy: 'price',
          sortDirection: 'asc',
        })
      );
    });
  });
});
