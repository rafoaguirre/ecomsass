import { ProductAvailability } from '@ecomsaas/domain';
import { describe, expect, it, vi } from 'vitest';
import { ProductsController } from './products.controller';
import type { ProductsService } from './products.service';

describe('ProductsController', () => {
  const vendorUser = { id: 'vendor-1', email: 'v@test.com', role: 'Vendor' as const };

  const productsService = {
    getById: vi.fn(),
    listByStore: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getPresignedUploadUrl: vi.fn(),
  } as unknown as ProductsService;

  const controller = new ProductsController(productsService);

  it('delegates getById to service', async () => {
    vi.mocked(productsService.getById).mockResolvedValue({ name: 'Widget' } as any);

    const result = await controller.getById('some-uuid');

    expect(result.name).toBe('Widget');
    expect(productsService.getById).toHaveBeenCalledWith('some-uuid');
  });

  it('delegates listByStore to service with parsed pagination', async () => {
    vi.mocked(productsService.listByStore).mockResolvedValue({ products: [], totalCount: 0 });

    await controller.listByStore('store-uuid', '10', '20', 'cat-1');

    expect(productsService.listByStore).toHaveBeenCalledWith('store-uuid', {
      offset: 10,
      limit: 20,
      categoryId: 'cat-1',
    });
  });

  it('delegates listByStore without pagination when params absent', async () => {
    vi.mocked(productsService.listByStore).mockResolvedValue({ products: [], totalCount: 0 });

    await controller.listByStore('store-uuid');

    expect(productsService.listByStore).toHaveBeenCalledWith('store-uuid', {
      offset: undefined,
      limit: undefined,
      categoryId: undefined,
    });
  });

  it('delegates create to service', async () => {
    const body = {
      storeId: 'store-1',
      name: 'New Widget',
      price: { amount: 1000, currency: 'CAD' },
      availability: ProductAvailability.Available,
    };
    vi.mocked(productsService.create).mockResolvedValue({ name: 'New Widget' } as any);

    const result = await controller.create(body as any, vendorUser);

    expect(result.name).toBe('New Widget');
    expect(productsService.create).toHaveBeenCalledWith(body, vendorUser);
  });

  it('delegates update to service', async () => {
    vi.mocked(productsService.update).mockResolvedValue({ name: 'Updated' } as any);

    const result = await controller.update('prod-1', { name: 'Updated' } as any, vendorUser);

    expect(result.name).toBe('Updated');
    expect(productsService.update).toHaveBeenCalledWith('prod-1', { name: 'Updated' }, vendorUser);
  });

  it('delegates remove to service', async () => {
    vi.mocked(productsService.remove).mockResolvedValue(undefined);

    await expect(controller.remove('prod-1', vendorUser)).resolves.toBeUndefined();
    expect(productsService.remove).toHaveBeenCalledWith('prod-1', vendorUser);
  });

  it('delegates getPresignedUploadUrl to service', async () => {
    vi.mocked(productsService.getPresignedUploadUrl).mockResolvedValue({
      key: 'products/abc.png',
      uploadUrl: 'https://example.com/signed',
    });

    const result = await controller.getPresignedUploadUrl({
      contentType: 'image/png',
      filename: 'photo.png',
    });

    expect(result.uploadUrl).toBe('https://example.com/signed');
    expect(productsService.getPresignedUploadUrl).toHaveBeenCalledWith('image/png', 'photo.png');
  });
});
