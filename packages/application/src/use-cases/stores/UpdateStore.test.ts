import { describe, it, expect, vi } from 'vitest';
import { StoreModel, StoreType, NotFoundError, ok, err } from '@ecomsaas/domain';
import { UpdateStore } from './UpdateStore';
import type { StoreRepository } from '../../ports';

describe('UpdateStore', () => {
  const baseStore = {
    id: 'store-1',
    vendorProfileId: 'vendor-1',
    name: 'Original Name',
    slug: 'original-slug',
    storeType: StoreType.General,
    address: {
      street: '123 Main',
      city: 'Halifax',
      province: 'NS',
      country: 'CA',
      postalCode: 'A1A1A1',
    },
    metadata: {},
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mockRepo: StoreRepository = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByVendorId: vi.fn(),
    findActive: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    slugExists: vi.fn(),
    searchActive: vi.fn(),
  };

  it('updates store name', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(mockRepo.findById).mockResolvedValue(ok(store));
    vi.mocked(mockRepo.save).mockImplementation(async (s) => ok(s));

    const useCase = new UpdateStore(mockRepo);
    const result = await useCase.execute({ id: 'store-1', name: 'New Name' });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.name).toBe('New Name');
      expect(result.value.slug).toBe('original-slug');
    }
  });

  it('deactivates a store', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(mockRepo.findById).mockResolvedValue(ok(store));
    vi.mocked(mockRepo.save).mockImplementation(async (s) => ok(s));

    const useCase = new UpdateStore(mockRepo);
    const result = await useCase.execute({ id: 'store-1', isActive: false });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isActive).toBe(false);
    }
  });

  it('returns NotFoundError when store does not exist', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(err(new NotFoundError('Store', 'store-1')));

    const useCase = new UpdateStore(mockRepo);
    const result = await useCase.execute({ id: 'store-1', name: 'Updated' });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundError);
    }
  });

  it('updates email and description via rebuild', async () => {
    const store = StoreModel.fromData(baseStore);
    vi.mocked(mockRepo.findById).mockResolvedValue(ok(store));
    vi.mocked(mockRepo.save).mockImplementation(async (s) => ok(s));

    const useCase = new UpdateStore(mockRepo);
    const result = await useCase.execute({
      id: 'store-1',
      email: 'new@test.com',
      description: 'Updated description',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.email).toBe('new@test.com');
      expect(result.value.description).toBe('Updated description');
    }
  });
});
