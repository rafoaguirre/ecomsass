import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { CreateProduct, GetProduct, UpdateProduct } from '@ecomsaas/application/use-cases';
import { ProductAvailability, ProductModel, ok } from '@ecomsaas/domain';
import { PRODUCT_REPOSITORY, PRODUCT_STORAGE } from './product.tokens';
import { OwnershipVerifier } from '../common/authorization/ownership-verifier';
import { ProductsService } from './products.service';

const baseProductInput = {
  storeId: 'store-0001',
  name: 'Widget',
  slug: 'widget',
  price: { amount: BigInt(1000), currency: 'CAD' as const },
  availability: ProductAvailability.Available,
  images: [],
  tags: [],
  metadata: {},
};

describe('Products integration', () => {
  const mockProductRepo = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByStoreId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    slugExists: vi.fn(),
  };

  const mockStorage = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    getSignedUrl: vi.fn(),
  };

  it('wires service -> repository and returns mapped product response', async () => {
    const product = ProductModel.create({
      ...baseProductInput,
      id: 'prod-1',
      name: 'Wired Product',
    });
    mockProductRepo.findById.mockResolvedValue(ok(product));

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: GetProduct, useValue: { execute: vi.fn() } },
        { provide: CreateProduct, useValue: { execute: vi.fn() } },
        { provide: UpdateProduct, useValue: { execute: vi.fn() } },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepo },
        {
          provide: OwnershipVerifier,
          useValue: {
            resolveVendorProfileId: vi.fn(),
            verifyStoreOwnership: vi.fn(),
            assertStoreOwnership: vi.fn(),
            verifyProductOwnership: vi.fn(),
            assertOrderAccess: vi.fn(),
          },
        },
        { provide: PRODUCT_STORAGE, useValue: mockStorage },
      ],
    }).compile();

    const service = moduleRef.get(ProductsService);
    const result = await service.getById('prod-1');

    expect(result.name).toBe('Wired Product');
    expect(mockProductRepo.findById).toHaveBeenCalledWith('prod-1', { activeOnly: true });
  });

  it('wires listByStore through repository', async () => {
    const products = [
      ProductModel.create({ ...baseProductInput, id: 'prod-A', slug: 'product-a', name: 'A' }),
      ProductModel.create({ ...baseProductInput, id: 'prod-B', slug: 'product-b', name: 'B' }),
    ];
    mockProductRepo.findByStoreId.mockResolvedValue({ data: products, total: 2 });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: GetProduct, useValue: { execute: vi.fn() } },
        { provide: CreateProduct, useValue: { execute: vi.fn() } },
        { provide: UpdateProduct, useValue: { execute: vi.fn() } },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepo },
        {
          provide: OwnershipVerifier,
          useValue: {
            resolveVendorProfileId: vi.fn(),
            verifyStoreOwnership: vi.fn(),
            assertStoreOwnership: vi.fn(),
            verifyProductOwnership: vi.fn(),
            assertOrderAccess: vi.fn(),
          },
        },
        { provide: PRODUCT_STORAGE, useValue: mockStorage },
      ],
    }).compile();

    const service = moduleRef.get(ProductsService);
    const result = await service.listByStore('store-1');

    expect(result.products).toHaveLength(2);
    expect(result.totalCount).toBe(2);
  });
});
