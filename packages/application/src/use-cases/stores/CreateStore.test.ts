import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreType, ValidationError, ok, err } from '@ecomsaas/domain';
import { CreateStore } from './CreateStore';
import type { StoreRepository } from '../../ports';
import type { IdGenerator } from '../../ports';

describe('CreateStore', () => {
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

  const mockIdGen: IdGenerator = {
    generate: vi.fn().mockReturnValue('store_abc123'),
    generateBatch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a store when slug is unique', async () => {
    vi.mocked(mockRepo.slugExists).mockResolvedValue(false);
    vi.mocked(mockRepo.save).mockImplementation(async (store) => ok(store));

    const useCase = new CreateStore(mockRepo, mockIdGen);

    const result = await useCase.execute({
      vendorProfileId: 'vendor-1',
      name: 'My Store',
      slug: 'my-store',
      storeType: StoreType.General,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.name).toBe('My Store');
      expect(result.value.slug).toBe('my-store');
    }
    expect(mockRepo.slugExists).toHaveBeenCalledWith('my-store');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('returns validation error when slug is taken', async () => {
    vi.mocked(mockRepo.slugExists).mockResolvedValue(true);

    const useCase = new CreateStore(mockRepo, mockIdGen);

    const result = await useCase.execute({
      vendorProfileId: 'vendor-1',
      name: 'My Store',
      slug: 'taken-slug',
      storeType: StoreType.General,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('slug');
    }
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('returns validation error when save fails', async () => {
    vi.mocked(mockRepo.slugExists).mockResolvedValue(false);
    vi.mocked(mockRepo.save).mockResolvedValue(err(new Error('DB error')));

    const useCase = new CreateStore(mockRepo, mockIdGen);

    const result = await useCase.execute({
      vendorProfileId: 'vendor-1',
      name: 'My Store',
      slug: 'new-store',
      storeType: StoreType.General,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });
});
