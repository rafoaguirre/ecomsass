import type { GetStore } from '@ecomsaas/application/use-cases';
import { NotFoundError, StoreModel, StoreType, err, ok } from '@ecomsaas/domain';
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

  beforeEach(() => {
    getStore = {
      execute: vi.fn(),
    } as unknown as GetStore;

    service = new StoresService(getStore);
  });

  it('returns active store for public endpoint', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(getStore.execute).mockResolvedValue(ok(store));

    const result = await service.getBySlugPublic('demo-store');

    expect(result.slug).toBe('demo-store');
    expect(result.vendorName).toBe('Demo Vendor');
  });

  it('hides inactive stores on public endpoint', async () => {
    const store = StoreModel.fromData({ ...baseStore, isActive: false });
    vi.mocked(getStore.execute).mockResolvedValue(ok(store));

    await expect(service.getBySlugPublic('demo-store')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns store for vendor endpoint even when inactive', async () => {
    const store = StoreModel.fromData({ ...baseStore, isActive: false });
    vi.mocked(getStore.execute).mockResolvedValue(ok(store));

    const result = await service.getBySlugForVendor('demo-store');

    expect(result.slug).toBe('demo-store');
  });

  it('maps domain not found to http not found', async () => {
    vi.mocked(getStore.execute).mockResolvedValue(err(new NotFoundError('Store', 'missing-store')));

    await expect(service.getBySlugPublic('missing-store')).rejects.toBeInstanceOf(NotFoundError);
  });
});
