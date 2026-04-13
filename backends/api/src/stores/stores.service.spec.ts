import type { StoreRepository } from '@ecomsaas/application/ports';
import type { CreateStore, GetStore, UpdateStore } from '@ecomsaas/application/use-cases';
import { NotFoundError, StoreModel, StoreType, ValidationError, err, ok } from '@ecomsaas/domain';
import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OwnershipVerifier } from '../common/authorization/ownership-verifier';
import { StoresService } from './stores.service';

describe('StoresService', () => {
  const baseStore = {
    id: 'store-1',
    vendorProfileId: 'vendor-1',
    name: 'Demo Store',
    slug: 'demo-store',
    storeType: StoreType.General,
    address: {
      street: '123 Main',
      city: 'Halifax',
      province: 'NS',
      country: 'CA',
      postalCode: 'A1A1A1',
    },
    metadata: { vendorName: 'Demo Vendor' },
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let service: StoresService;
  let getStore: GetStore;
  let createStore: CreateStore;
  let updateStore: UpdateStore;
  let storeRepository: StoreRepository;
  let ownership: OwnershipVerifier;
  const vendorUser = { id: 'vendor-1', email: 'v@test.com', role: 'Vendor' };
  const adminUser = { id: 'admin-1', email: 'a@test.com', role: 'Admin' };

  beforeEach(() => {
    getStore = { execute: vi.fn() } as unknown as GetStore;
    createStore = { execute: vi.fn() } as unknown as CreateStore;
    updateStore = { execute: vi.fn() } as unknown as UpdateStore;
    storeRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByVendorId: vi.fn(),
      findActive: vi.fn(),
      searchActive: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
    } as unknown as StoreRepository;

    ownership = {
      resolveVendorProfileId: vi.fn().mockResolvedValue('vendor-1'),
      verifyStoreOwnership: vi.fn().mockResolvedValue(undefined),
      assertStoreOwnership: vi.fn().mockResolvedValue(undefined),
      verifyProductOwnership: vi.fn().mockResolvedValue(undefined),
      assertOrderAccess: vi.fn().mockResolvedValue(undefined),
    } as unknown as OwnershipVerifier;

    service = new StoresService(getStore, createStore, updateStore, storeRepository, ownership);
  });

  it('returns active store for public endpoint without sensitive fields', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(getStore.execute).mockResolvedValue(ok(store));

    const result = await service.getBySlugPublic('demo-store');

    expect(result.slug).toBe('demo-store');
    expect(result.vendorName).toBe('Demo Vendor');
    expect(result).not.toHaveProperty('vendorProfileId');
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phoneNumber');
    expect(result).not.toHaveProperty('phoneCountryCode');
    expect(result).not.toHaveProperty('metadata');
  });

  it('hides inactive stores on public endpoint', async () => {
    const store = StoreModel.fromData({ ...baseStore, isActive: false });
    vi.mocked(getStore.execute).mockResolvedValue(ok(store));

    await expect(service.getBySlugPublic('demo-store')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns store for vendor endpoint even when inactive', async () => {
    const store = StoreModel.fromData({ ...baseStore, isActive: false });
    vi.mocked(getStore.execute).mockResolvedValue(ok(store));

    const result = await service.getBySlugForVendor('demo-store', vendorUser);

    expect(result.slug).toBe('demo-store');
  });

  it('maps domain not found to thrown error', async () => {
    vi.mocked(getStore.execute).mockResolvedValue(err(new NotFoundError('Store', 'missing-store')));

    await expect(service.getBySlugPublic('missing-store')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates a store via use case', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(createStore.execute).mockResolvedValue(ok(store));

    const result = await service.createForUser(
      {
        name: 'Demo Store',
        slug: 'demo-store',
        storeType: StoreType.General,
      },
      vendorUser
    );

    expect(result.name).toBe('Demo Store');
    expect(createStore.execute).toHaveBeenCalled();
  });

  it('throws on create validation error', async () => {
    vi.mocked(createStore.execute).mockResolvedValue(
      err(new ValidationError('Slug already in use'))
    );

    await expect(
      service.createForUser(
        {
          name: 'Test',
          slug: 'taken-slug',
          storeType: StoreType.General,
        },
        vendorUser
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates a store via use case', async () => {
    const updated = StoreModel.fromData({ ...baseStore, name: 'Updated' });
    vi.mocked(updateStore.execute).mockResolvedValue(ok(updated));

    const result = await service.update({ id: 'store-1', name: 'Updated' }, vendorUser);

    expect(result.name).toBe('Updated');
    expect(ownership.verifyStoreOwnership).toHaveBeenCalledWith('store-1', vendorUser);
  });

  it('soft-deletes a store via repository', async () => {
    vi.mocked(storeRepository.delete).mockResolvedValue(ok(undefined));

    await expect(service.remove('store-1', vendorUser)).resolves.toBeUndefined();
    expect(ownership.verifyStoreOwnership).toHaveBeenCalledWith('store-1', vendorUser);
    expect(storeRepository.delete).toHaveBeenCalledWith('store-1');
  });

  it('throws ForbiddenException when vendor does not own store on update', async () => {
    vi.mocked(ownership.verifyStoreOwnership).mockRejectedValueOnce(
      new ForbiddenException('You do not own this store')
    );

    await expect(service.update({ id: 'store-1', name: 'Hacked' }, vendorUser)).rejects.toThrow(
      'You do not own this store'
    );
  });

  it('allows Admin to update any store', async () => {
    const updated = StoreModel.fromData({ ...baseStore, name: 'Admin Updated' });
    vi.mocked(updateStore.execute).mockResolvedValue(ok(updated));

    const result = await service.update({ id: 'store-1', name: 'Admin Updated' }, adminUser);

    expect(result.name).toBe('Admin Updated');
    expect(ownership.verifyStoreOwnership).toHaveBeenCalledWith('store-1', adminUser);
  });

  it('gets store by id without sensitive fields', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(getStore.execute).mockResolvedValue(ok(store));

    const result = await service.getByIdPublic('store-1');

    expect(result.id).toBe('store-1');
    expect(getStore.execute).toHaveBeenCalledWith({
      identifier: 'store-1',
      identifierType: 'id',
    });
    expect(result).not.toHaveProperty('vendorProfileId');
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phoneNumber');
    expect(result).not.toHaveProperty('phoneCountryCode');
    expect(result).not.toHaveProperty('metadata');
  });

  it('lists stores by vendor', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(storeRepository.findByVendorId).mockResolvedValue([store]);

    const result = await service.listByVendor('vendor-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('demo-store');
  });

  it('lists active stores for marketplace', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(storeRepository.searchActive).mockResolvedValue({ data: [store], total: 1 });

    const result = await service.listForMarketplace();

    expect(result.stores).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(storeRepository.searchActive).toHaveBeenCalled();
  });

  it('passes search params through to repository', async () => {
    vi.mocked(storeRepository.searchActive).mockResolvedValue({ data: [], total: 0 });

    const result = await service.listForMarketplace({
      q: 'pizza',
      storeType: 'RESTAURANT' as never,
      sortBy: 'name',
      sortDirection: 'asc',
      offset: 10,
      limit: 5,
    });

    expect(result.stores).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.hasMore).toBe(false);
    expect(storeRepository.searchActive).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'pizza', storeType: 'RESTAURANT' })
    );
  });
});
