import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetStore } from './GetStore';
import { StoreModel, NotFoundError, StoreType, ok, err } from '@ecomsaas/domain';
import type { StoreRepository } from '../../ports';

describe('GetStore Use Case', () => {
  let getStore: GetStore;
  let mockStoreRepository: StoreRepository;

  const mockStoreData = {
    id: 'store-123',
    vendorProfileId: 'vendor-456',
    name: 'Test Store',
    slug: 'test-store',
    storeType: StoreType.General,
  };

  beforeEach(() => {
    // Create mock repository
    mockStoreRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByVendorId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
    };

    getStore = new GetStore(mockStoreRepository);
  });

  describe('execute', () => {
    it('should retrieve a store by slug (default)', async () => {
      const mockStore = StoreModel.create(mockStoreData);
      vi.mocked(mockStoreRepository.findBySlug).mockResolvedValue(ok(mockStore));

      const result = await getStore.execute({ identifier: 'test-store' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(mockStore);
      }
      expect(mockStoreRepository.findBySlug).toHaveBeenCalledWith('test-store');
      expect(mockStoreRepository.findById).not.toHaveBeenCalled();
    });

    it('should retrieve a store by slug when explicitly specified', async () => {
      const mockStore = StoreModel.create(mockStoreData);
      vi.mocked(mockStoreRepository.findBySlug).mockResolvedValue(ok(mockStore));

      const result = await getStore.execute({
        identifier: 'test-store',
        identifierType: 'slug',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(mockStore);
      }
      expect(mockStoreRepository.findBySlug).toHaveBeenCalledWith('test-store');
    });

    it('should retrieve a store by ID when specified', async () => {
      const mockStore = StoreModel.create(mockStoreData);
      vi.mocked(mockStoreRepository.findById).mockResolvedValue(ok(mockStore));

      const result = await getStore.execute({
        identifier: 'store-123',
        identifierType: 'id',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(mockStore);
      }
      expect(mockStoreRepository.findById).toHaveBeenCalledWith('store-123');
      expect(mockStoreRepository.findBySlug).not.toHaveBeenCalled();
    });

    it('should return NotFoundError when store does not exist', async () => {
      const notFoundError = new NotFoundError('Store', 'non-existent');
      vi.mocked(mockStoreRepository.findBySlug).mockResolvedValue(err(notFoundError));

      const result = await getStore.execute({ identifier: 'non-existent' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });
});
