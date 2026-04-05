import type { StoreRepository } from '@ecomsaas/application/ports';
import type { CreateStore, GetStore, UpdateStore } from '@ecomsaas/application/use-cases';
import { NotFoundError, StoreModel, StoreType, ValidationError, err, ok } from '@ecomsaas/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
    } as unknown as StoreRepository;

    service = new StoresService(getStore, createStore, updateStore, storeRepository);
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

    const result = await service.create({
      vendorProfileId: 'vendor-1',
      name: 'Demo Store',
      slug: 'demo-store',
      storeType: StoreType.General,
    });

    expect(result.name).toBe('Demo Store');
    expect(createStore.execute).toHaveBeenCalled();
  });

  it('throws on create validation error', async () => {
    vi.mocked(createStore.execute).mockResolvedValue(
      err(new ValidationError('Slug already in use'))
    );

    await expect(
      service.create({
        vendorProfileId: 'vendor-1',
        name: 'Test',
        slug: 'taken-slug',
        storeType: StoreType.General,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates a store via use case', async () => {
    const storeForOwnership = StoreModel.fromData(baseStore);
    vi.mocked(storeRepository.findById).mockResolvedValue(ok(storeForOwnership));
    const updated = StoreModel.fromData({ ...baseStore, name: 'Updated' });
    vi.mocked(updateStore.execute).mockResolvedValue(ok(updated));

    const result = await service.update({ id: 'store-1', name: 'Updated' }, vendorUser);

    expect(result.name).toBe('Updated');
  });

  it('soft-deletes a store via repository', async () => {
    const storeForOwnership = StoreModel.fromData(baseStore);
    vi.mocked(storeRepository.findById).mockResolvedValue(ok(storeForOwnership));
    vi.mocked(storeRepository.delete).mockResolvedValue(ok(undefined));

    await expect(service.remove('store-1', vendorUser)).resolves.toBeUndefined();
    expect(storeRepository.delete).toHaveBeenCalledWith('store-1');
  });

  it('throws ForbiddenException when vendor does not own store on update', async () => {
    const otherStore = StoreModel.fromData({ ...baseStore, vendorProfileId: 'vendor-2' });
    vi.mocked(storeRepository.findById).mockResolvedValue(ok(otherStore));

    await expect(service.update({ id: 'store-1', name: 'Hacked' }, vendorUser)).rejects.toThrow(
      'You do not own this store'
    );
  });

  it('allows Admin to update any store', async () => {
    const updated = StoreModel.fromData({ ...baseStore, name: 'Admin Updated' });
    vi.mocked(updateStore.execute).mockResolvedValue(ok(updated));

    const result = await service.update({ id: 'store-1', name: 'Admin Updated' }, adminUser);

    expect(result.name).toBe('Admin Updated');
    expect(storeRepository.findById).not.toHaveBeenCalled();
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
    vi.mocked(storeRepository.findActive).mockResolvedValue([store]);

    const result = await service.listForMarketplace();

    expect(result).toHaveLength(1);
    expect(storeRepository.findActive).toHaveBeenCalled();
  });
});
