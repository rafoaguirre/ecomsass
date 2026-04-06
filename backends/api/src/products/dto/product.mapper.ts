import type {
  ProductResponse,
  ProductListResponse,
  ProductSummary,
  ProductSearchResponse,
} from '@ecomsaas/contracts';
import type { ProductModel } from '@ecomsaas/domain';

export function toProductResponse(product: ProductModel): ProductResponse {
  return {
    id: product.id,
    storeId: product.storeId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: {
      amount: Number(product.price.amount),
      currency: product.price.currency,
    } as unknown as ProductModel['price'],
    compareAtPrice: product.compareAtPrice
      ? ({
          amount: Number(product.compareAtPrice.amount),
          currency: product.compareAtPrice.currency,
        } as unknown as ProductModel['compareAtPrice'])
      : undefined,
    images: product.images,
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    availability: product.availability,
    inventory: product.inventory,
    variants: product.variants,
    tags: product.tags,
    metadata: product.metadata,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    isLowStock: product.isLowStock(),
  };
}

export function toProductListResponse(products: ProductModel[]): ProductListResponse {
  return {
    products: products.map(toProductResponse),
    totalCount: products.length,
  };
}

export function toProductSummary(product: ProductModel): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: {
      amount: product.price.amount.toString(),
      currency: product.price.currency,
    },
    mainImage: product.images?.[0]?.src,
    availability: product.availability,
  };
}

export function toProductSearchResponse(
  products: ProductModel[],
  total: number,
  offset: number,
  limit: number
): ProductSearchResponse {
  return {
    products: products.map(toProductSummary),
    totalCount: total,
    hasMore: offset + limit < total,
  };
}
