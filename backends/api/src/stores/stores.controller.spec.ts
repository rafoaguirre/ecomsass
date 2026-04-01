import { describe, expect, it, vi } from 'vitest';
import { StoresController } from './stores.controller';
import type { StoresService } from './stores.service';

describe('StoresController', () => {
  const storesService = {
    getBySlugPublic: vi.fn(),
    getBySlugForVendor: vi.fn(),
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

    const result = await controller.getBySlugVendor('demo-store');

    expect(result.slug).toBe('demo-store');
    expect(storesService.getBySlugForVendor).toHaveBeenCalledWith('demo-store');
  });
});
