import type {
  ProductResponse,
  ProductListResponse,
  ProductSummary,
  ProductSearchResponse,
} from '@ecomsaas/contracts';
import type { ProductModel } from '@ecomsaas/domain';
import type { Money } from '@ecomsaas/domain';

function toMoneyResponse(money: Money) {
  return { amount: money.amount.toString(), currency: money.currency };
}

export function toProductResponse(product: ProductModel): ProductResponse {
  return {
    id: product.id,
    storeId: product.storeId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: toMoneyResponse(product.price),
    compareAtPrice: product.compareAtPrice ? toMoneyResponse(product.compareAtPrice) : undefined,
    images: product.images,
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    availability: product.availability,
    inventory: product.inventory,
    variants: product.variants?.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price ? toMoneyResponse(v.price) : undefined,
      inventory: v.inventory,
      attributes: v.attributes,
    })),
    tags: product.tags,
    metadata: product.metadata,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
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
