/**
 * Server-side API helper for fetching public data from the NestJS backend.
 * Used in React Server Components — do NOT import in client components.
 */
import 'server-only';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('NEXT_PUBLIC_API_URL is required in production');
      })()
    : 'http://localhost:3000');

// ── Response types ──────────────────────────────────────────────

export interface StoreListItem {
  id: string;
  name: string;
  description?: string;
  slug: string;
  storeType: string;
  isActive: boolean;
  vendorName: string;
}

export interface StoreListResponse {
  stores: StoreListItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface PublicStoreResponse {
  id: string;
  name: string;
  description?: string;
  address?: {
    street: string;
    street2?: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
  };
  slug: string;
  storeType: string;
  isActive: boolean;
  operatingHours?: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
  vendorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPrice {
  amount: string;
  currency: string;
}

export interface ProductImage {
  src: string;
  name?: string;
  alt?: string;
  directory: string;
  type: string;
  main: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: ProductPrice;
  mainImage?: string;
  availability: string;
}

export interface ProductSearchResponse {
  products: ProductListItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface ProductResponse {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  price: ProductPrice;
  compareAtPrice?: ProductPrice;
  images: ProductImage[];
  categoryId?: string;
  supplierId?: string;
  availability: string;
  inventory?: {
    quantity: number;
    trackQuantity: boolean;
    lowStockThreshold?: number;
  };
  tags: string[];
  metadata: Record<string, unknown>;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: ProductResponse[];
  totalCount: number;
}

// ── Fetcher ─────────────────────────────────────────────────────

async function fetchApi<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    next: { revalidate: 60 }, // ISR: refresh every 60s
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ── Store queries ───────────────────────────────────────────────

export interface StoreQueryParams {
  q?: string;
  storeType?: string;
  sortBy?: 'name' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export function fetchStores(params: StoreQueryParams = {}): Promise<StoreListResponse> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.storeType) qs.set('storeType', params.storeType);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDirection) qs.set('sortDirection', params.sortDirection);
  if (params.offset != null) qs.set('offset', String(params.offset));
  if (params.limit != null) qs.set('limit', String(params.limit));

  const query = qs.toString();
  return fetchApi<StoreListResponse>(`/api/v1/stores${query ? `?${query}` : ''}`);
}

export function fetchStoreBySlug(slug: string): Promise<PublicStoreResponse> {
  return fetchApi<PublicStoreResponse>(`/api/v1/stores/slug/${encodeURIComponent(slug)}`);
}

// ── Product queries ─────────────────────────────────────────────

export function fetchStoreProducts(
  storeId: string,
  params: { offset?: number; limit?: number } = {}
): Promise<ProductListResponse> {
  const qs = new URLSearchParams();
  if (params.offset != null) qs.set('offset', String(params.offset));
  if (params.limit != null) qs.set('limit', String(params.limit));

  const query = qs.toString();
  return fetchApi<ProductListResponse>(
    `/api/v1/stores/${encodeURIComponent(storeId)}/products${query ? `?${query}` : ''}`
  );
}

export function fetchProduct(id: string): Promise<ProductResponse> {
  return fetchApi<ProductResponse>(`/api/v1/products/${encodeURIComponent(id)}`);
}

export interface ProductSearchParams {
  q?: string;
  storeId?: string;
  availability?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export function searchProducts(params: ProductSearchParams = {}): Promise<ProductSearchResponse> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.storeId) qs.set('storeId', params.storeId);
  if (params.availability) qs.set('availability', params.availability);
  if (params.minPrice != null) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) qs.set('maxPrice', String(params.maxPrice));
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDirection) qs.set('sortDirection', params.sortDirection);
  if (params.offset) qs.set('offset', String(params.offset));
  if (params.limit) qs.set('limit', String(params.limit));

  const query = qs.toString();
  return fetchApi<ProductSearchResponse>(`/api/v1/products${query ? `?${query}` : ''}`);
}
