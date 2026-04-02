import { describe, expect, it, vi } from 'vitest';
import { StoresController } from './stores.controller';
import type { StoresService } from './stores.service';

describe('StoresController', () => {
  const storesService = {
    getBySlugPublic: vi.fn(),
    getBySlugForVendor: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    listForMarketplace: vi.fn(),
    listByVendor: vi.fn(),
  } as unknown as StoresService;

  const controller = new StoresController(storesService);

  it('delegates getBySlug to service', async () => {
    vi.mocked(storesService.getBySlugPublic).mockResolvedValue({
      id: 'store-1',
      vendorProfileId: 'vendor-1',
      name: 'Demo Store',
      slug: 'demo-store',
      storeType: 'GENERAL',
      isActive: true,
      address: {
        street: '123 Main',
        city: 'Halifax',
        province: 'NS',
        country: 'CA',
        postalCode: 'A1A1A1',
      },
      metadata: {},
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      vendorName: 'Demo Vendor',
    } as any);

    const result = await controller.getBySlug('demo-store');

    expect(result.slug).toBe('demo-store');
    expect(storesService.getBySlugPublic).toHaveBeenCalledWith('demo-store');
  });

  it('delegates getBySlugVendor to service', async () => {
    vi.mocked(storesService.getBySlugForVendor).mockResolvedValue({ slug: 'demo-store' } as any);

    const user = { id: 'vendor-1', email: 'v@test.com', role: 'Vendor' };
    const result = await controller.getBySlugVendor('demo-store', user);

    expect(result.slug).toBe('demo-store');
    expect(storesService.getBySlugForVendor).toHaveBeenCalledWith('demo-store', user);
  });

  it('delegates create to service with vendor id from user', async () => {
    const storeResponse = { id: 'store-1', name: 'New Store' } as any;
    vi.mocked(storesService.create).mockResolvedValue(storeResponse);

    const user = { id: 'vendor-1', email: 'v@test.com', role: 'Vendor' };
    const body = {
      name: 'New Store',
      slug: 'new-store',
      storeType: 'GENERAL' as any,
      address: { street: '', city: '', province: '', country: '', postalCode: '' },
    };

    const result = await controller.create(body, user);

    expect(result.id).toBe('store-1');
    expect(storesService.create).toHaveBeenCalledWith({
      vendorProfileId: 'vendor-1',
      ...body,
    });
  });

  it('delegates update to service', async () => {
    const updated = { id: 'store-1', name: 'Updated' } as any;
    vi.mocked(storesService.update).mockResolvedValue(updated);

    const user = { id: 'vendor-1', email: 'v@test.com', role: 'Vendor' };
    const result = await controller.update('store-1', { name: 'Updated' }, user);

    expect(result.name).toBe('Updated');
    expect(storesService.update).toHaveBeenCalledWith({ id: 'store-1', name: 'Updated' }, user);
  });

  it('delegates remove to service', async () => {
    vi.mocked(storesService.remove).mockResolvedValue(undefined);

    const user = { id: 'vendor-1', email: 'v@test.com', role: 'Vendor' };
    await controller.remove('store-1', user);

    expect(storesService.remove).toHaveBeenCalledWith('store-1', user);
  });

  it('delegates list to service', async () => {
    vi.mocked(storesService.listForMarketplace).mockResolvedValue([
      { id: 'store-1', name: 'Store', slug: 'store', isActive: true },
    ]);

    const result = await controller.list();

    expect(result).toHaveLength(1);
  });
});
