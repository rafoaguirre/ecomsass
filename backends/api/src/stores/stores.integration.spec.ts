import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { GetStore } from '@ecomsaas/application/use-cases';
import { StoreModel, StoreType, ok } from '@ecomsaas/domain';
import { StoresService } from './stores.service';

describe('Stores integration', () => {
  it('wires service -> use case and returns mapped store response', async () => {
    const getStore = {
      execute: vi.fn().mockResolvedValue(
        ok(
          StoreModel.fromData({
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
          })
        )
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [StoresService, { provide: GetStore, useValue: getStore }],
    }).compile();

    const service = moduleRef.get(StoresService);
    const result = await service.getBySlugPublic('demo-store');

    expect(result.name).toBe('Demo Store');
    expect(result.vendorName).toBe('Demo Vendor');
    expect(getStore.execute).toHaveBeenCalledWith({
      identifier: 'demo-store',
      identifierType: 'slug',
    });
  });
});
