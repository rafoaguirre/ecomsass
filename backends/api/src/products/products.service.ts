import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]);
import {
  GetProduct,
  CreateProduct,
  UpdateProduct,
  type UpdateProductInput,
} from '@ecomsaas/application/use-cases';
import type { ProductRepository, StoreRepository } from '@ecomsaas/application/ports';
import type { Storage } from '@ecomsaas/infrastructure/storage';
import type {
  CreateProductRequest,
  UpdateProductRequest,
  ProductResponse,
  ProductListResponse,
} from '@ecomsaas/contracts';
import type { ProductModel, CurrencyCode } from '@ecomsaas/domain';
import type { AuthUser } from '../auth/types/auth-user';
import { PRODUCT_REPOSITORY, PRODUCT_STORAGE } from './product.tokens';
import { STORE_REPOSITORY } from '../stores/store.tokens';
import { toProductResponse, toProductListResponse } from './dto/product.mapper';
import { createIdGenerator } from '@ecomsaas/infrastructure/id-generator';

const idGenerator = createIdGenerator();

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toMoney(input: { amount: number; currency: string }): ProductModel['price'] {
  return { amount: BigInt(input.amount), currency: input.currency as CurrencyCode };
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(GetProduct) private readonly getProduct: GetProduct,
    @Inject(CreateProduct) private readonly createProductUC: CreateProduct,
    @Inject(UpdateProduct) private readonly updateProductUC: UpdateProduct,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository,
    @Inject(STORE_REPOSITORY) private readonly storeRepository: StoreRepository,
    @Inject(PRODUCT_STORAGE) private readonly storage: Storage
  ) {}

  async getById(id: string): Promise<ProductResponse> {
    const result = await this.getProduct.execute({ identifier: id, identifierType: 'id' });

    if (result.isErr()) {
      throw result.error;
    }

    return toProductResponse(result.value);
  }

  async create(request: CreateProductRequest, user: AuthUser): Promise<ProductResponse> {
    await this.verifyStoreOwnership(request.storeId, user);

    const result = await this.createProductUC.execute({
      id: idGenerator.generate('prod'),
      storeId: request.storeId,
      name: request.name,
      slug: toSlug(request.name),
      description: request.description,
      price: toMoney(request.price),
      compareAtPrice: request.compareAtPrice ? toMoney(request.compareAtPrice) : undefined,
      images: (request.images as ProductModel['images']) ?? [],
      categoryId: request.categoryId,
      supplierId: request.supplierId,
      availability: request.availability,
      inventory: request.inventory
        ? {
            trackQuantity: request.inventory.trackQuantity,
            quantity: request.inventory.quantity ?? 0,
            lowStockThreshold: request.inventory.lowStockThreshold,
          }
        : undefined,
      variants: request.variants?.map((v) => ({
        id: idGenerator.generate('var'),
        name: v.name,
        sku: v.sku,
        price: v.price ? toMoney(v.price) : undefined,
        inventory: undefined,
        attributes: v.attributes,
      })),
      tags: request.tags,
      metadata: request.metadata,
    });

    if (result.isErr()) {
      throw result.error;
    }

    return toProductResponse(result.value);
  }

  async update(
    id: string,
    request: UpdateProductRequest,
    user: AuthUser
  ): Promise<ProductResponse> {
    await this.verifyProductOwnership(id, user);

    const input: UpdateProductInput = {
      id,
      name: request.name,
      description: request.description,
      price: request.price ? toMoney(request.price) : undefined,
      compareAtPrice: request.compareAtPrice ? toMoney(request.compareAtPrice) : undefined,
      images: request.images as ProductModel['images'] | undefined,
      categoryId: request.categoryId,
      supplierId: request.supplierId,
      availability: request.availability,
      inventory: request.inventory,
      tags: request.tags,
      metadata: request.metadata,
    };

    const result = await this.updateProductUC.execute(input);

    if (result.isErr()) {
      throw result.error;
    }

    return toProductResponse(result.value);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    await this.verifyProductOwnership(id, user);

    const result = await this.productRepository.delete(id);

    if (result.isErr()) {
      throw result.error;
    }
  }

  async listByStore(
    storeId: string,
    options?: { offset?: number; limit?: number; categoryId?: string }
  ): Promise<ProductListResponse> {
    const products = await this.productRepository.findByStoreId(storeId, options);
    return toProductListResponse(products);
  }

  async getPresignedUploadUrl(
    contentType: string,
    filename: string
  ): Promise<{ key: string; uploadUrl: string }> {
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
      throw new BadRequestException(
        `Unsupported content type. Allowed: ${[...ALLOWED_IMAGE_TYPES].join(', ')}`
      );
    }

    if (!filename || filename.length > 255) {
      throw new BadRequestException('Filename is required and must be at most 255 characters');
    }

    const ext =
      filename
        .split('.')
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, '') ?? 'bin';
    const key = `products/${idGenerator.generate('img')}.${ext}`;
    const uploadUrl = await this.storage.getSignedUrl(key, 3600);
    return { key, uploadUrl };
  }

  // ── Ownership helpers ────────────────────────────────────────────────────

  private async verifyStoreOwnership(storeId: string, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;

    const result = await this.storeRepository.findById(storeId);

    if (result.isErr()) {
      throw result.error;
    }

    if (result.value.vendorProfileId !== user.id) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  private async verifyProductOwnership(productId: string, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;

    const result = await this.productRepository.findById(productId);

    if (result.isErr()) {
      throw result.error;
    }

    await this.verifyStoreOwnership(result.value.storeId, user);
  }
}
