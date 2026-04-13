import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  createTestApp,
  type TestApp,
  buildStore,
  buildProduct,
  resetFactories,
  authHeader,
} from '../helpers';

/**
 * Convert a ProductModel to the Supabase DB row format returned
 * by `from('products').select('*')`.
 */
function toProductRow(product: ReturnType<typeof buildProduct>) {
  return {
    id: product.id,
    store_id: product.storeId,
    name: product.name,
    slug: product.slug,
    description: product.description ?? null,
    price_amount: product.price.amount.toString(),
    price_currency: product.price.currency,
    compare_at_price_amount: product.compareAtPrice?.amount.toString() ?? null,
    compare_at_price_currency: product.compareAtPrice?.currency ?? null,
    images: product.images,
    category_id: product.categoryId ?? null,
    supplier_id: product.supplierId ?? null,
    availability: product.availability,
    inventory: product.inventory ?? null,
    variants: product.variants ?? null,
    tags: product.tags,
    metadata: product.metadata,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
  };
}

/**
 * Convert a Store to the row format used by SupabaseStoreRepository
 * (includes the vendor_profiles join).
 */
function toStoreRow(store: ReturnType<typeof buildStore>) {
  return {
    id: store.id,
    vendor_profile_id: store.vendorProfileId,
    name: store.name,
    slug: store.slug,
    store_type: store.storeType,
    is_active: store.isActive,
    address: store.address,
    metadata: store.metadata,
    description: store.description ?? null,
    email: store.email ?? null,
    phone_number: store.phoneNumber ?? null,
    phone_country_code: store.phoneCountryCode ?? null,
    operating_hours: store.operatingHours ?? null,
    created_at: store.createdAt.toISOString(),
    updated_at: store.updatedAt.toISOString(),
    vendor_profiles: {
      business_name:
        typeof store.metadata.vendorName === 'string' ? store.metadata.vendorName : null,
    },
  };
}

describe('Products (e2e)', () => {
  const VENDOR_ID = 'vendor-user-1';

  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({
      auth: { authUser: { id: VENDOR_ID, role: 'Vendor' } },
    });
  });

  afterAll(async () => {
    await testApp?.close();
  });

  beforeEach(() => {
    resetFactories();
  });

  // ── GET /api/v1/products/:id ──────────────────────────────────────────────

  describe('GET /api/v1/products/:id', () => {
    it('returns 200 with product data when product exists', async () => {
      const product = buildProduct({
        id: '00000000-0000-4000-a000-000000000001',
        name: 'My Widget',
      });
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toProductRow(product), error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/products/${product.id}`)
        .expect(200);

      expect(res.body).toMatchObject({
        name: 'My Widget',
      });
    });

    it('returns 404 when product does not exist', async () => {
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: null, error: null })
      );

      await request(testApp.app.getHttpServer())
        .get('/api/v1/products/00000000-0000-4000-a000-000000000002')
        .expect(404);
    });

    it('returns 400 when id is not a valid UUID', async () => {
      await request(testApp.app.getHttpServer()).get('/api/v1/products/not-a-uuid').expect(400);
    });
  });

  // ── GET /api/v1/stores/:storeId/products ──────────────────────────────────

  describe('GET /api/v1/stores/:storeId/products', () => {
    it('returns 200 with empty list when no products', async () => {
      testApp.supabaseClient.__queryBuilder.returns.mockImplementationOnce(() =>
        Promise.resolve({ data: [], error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/stores/00000000-0000-4000-a000-000000000003/products')
        .expect(200);

      expect(res.body).toMatchObject({ products: [], totalCount: 0 });
    });

    it('returns 400 when storeId is not a valid UUID', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/stores/not-a-uuid/products')
        .expect(400);
    });
  });

  // ── POST /api/v1/products ─────────────────────────────────────────────────

  describe('POST /api/v1/products', () => {
    it('returns 401 when no auth token is provided', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/products')
        .send({
          storeId: '00000000-0000-4000-a000-000000000004',
          name: 'Widget',
          price: { amount: 999, currency: 'CAD' },
          availability: 'AVAILABLE',
        })
        .expect(401);
    });

    it('returns 400 when request body is invalid', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', authHeader())
        .send({ name: 'Missing storeId and price' })
        .expect(400);
    });

    it('returns 403 when vendor creates product in a store they do not own', async () => {
      const store = buildStore({
        id: '00000000-0000-4000-a000-000000000005',
        vendorProfileId: 'some-other-vendor',
      });

      // OwnershipVerifier resolves vendor profile first, then loads store
      testApp.supabaseClient.__queryBuilder.maybeSingle
        // Vendor profile lookup returns a profile whose id differs from the store owner
        .mockImplementationOnce(() =>
          Promise.resolve({
            data: {
              id: VENDOR_ID,
              user_id: VENDOR_ID,
              business_name: 'Test',
              phone: null,
              phone_country_code: null,
              addresses: [],
              verification_status: 'Pending',
              stripe_connect_id: null,
              agreement_accepted: false,
              onboarding_completed: false,
              metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          })
        )
        // Store ownership lookup returns a store not owned by our vendor
        .mockImplementationOnce(() => Promise.resolve({ data: toStoreRow(store), error: null }));

      await request(testApp.app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', authHeader(VENDOR_ID))
        .send({
          storeId: store.id,
          name: 'Widget',
          price: { amount: 999, currency: 'CAD' },
          availability: 'AVAILABLE',
        })
        .expect(403);
    });
  });

  // ── DELETE /api/v1/products/:id ───────────────────────────────────────────

  describe('DELETE /api/v1/products/:id', () => {
    it('returns 401 when no auth token is provided', async () => {
      await request(testApp.app.getHttpServer())
        .delete('/api/v1/products/00000000-0000-4000-a000-000000000006')
        .expect(401);
    });

    it('returns 404 when product does not exist', async () => {
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: null, error: null })
      );

      await request(testApp.app.getHttpServer())
        .delete('/api/v1/products/00000000-0000-4000-a000-000000000007')
        .set('Authorization', authHeader())
        .expect(404);
    });
  });

  // ── PUT /api/v1/products/:id ──────────────────────────────────────────────

  describe('PUT /api/v1/products/:id', () => {
    it('returns 401 when no auth token is provided', async () => {
      await request(testApp.app.getHttpServer())
        .put('/api/v1/products/00000000-0000-0000-0000-000000000001')
        .send({ name: 'Updated' })
        .expect(401);
    });
  });

  // ── Public endpoint: GET /api/v1/products (search) ────────────────────────

  describe('GET /api/v1/products', () => {
    it('returns 200 with paginated product list', async () => {
      const product = buildProduct({ name: 'Widget', storeId: 'store-1' });
      testApp.supabaseClient.__setQueryResult([toProductRow(product)], null, 1);

      const res = await request(testApp.app.getHttpServer()).get('/api/v1/products').expect(200);

      expect(res.body).toMatchObject({
        products: [expect.objectContaining({ name: 'Widget' })],
        totalCount: 1,
        hasMore: false,
      });
    });

    it('returns empty list when no products match', async () => {
      testApp.supabaseClient.__setQueryResult([], null, 0);

      const res = await request(testApp.app.getHttpServer()).get('/api/v1/products').expect(200);

      expect(res.body).toMatchObject({
        products: [],
        totalCount: 0,
        hasMore: false,
      });
    });

    it('passes search and filter params through to Supabase client', async () => {
      testApp.supabaseClient.__setQueryResult([], null, 0);

      await request(testApp.app.getHttpServer())
        .get(
          '/api/v1/products?q=widget&storeId=s1&availability=AVAILABLE&minPrice=10&maxPrice=100&sortBy=price&sortDirection=desc'
        )
        .expect(200);

      expect(testApp.supabaseClient.__queryBuilder.ilike).toHaveBeenCalledWith('name', '%widget%');
      expect(testApp.supabaseClient.__queryBuilder.eq).toHaveBeenCalledWith('store_id', 's1');
      expect(testApp.supabaseClient.__queryBuilder.eq).toHaveBeenCalledWith(
        'availability',
        'AVAILABLE'
      );
      expect(testApp.supabaseClient.__queryBuilder.gte).toHaveBeenCalledWith('price_amount', '10');
      expect(testApp.supabaseClient.__queryBuilder.lte).toHaveBeenCalledWith('price_amount', '100');
      expect(testApp.supabaseClient.__queryBuilder.order).toHaveBeenCalledWith('price_amount', {
        ascending: false,
      });
    });

    it('returns hasMore=true when more results exist', async () => {
      const product = buildProduct();
      testApp.supabaseClient.__setQueryResult([toProductRow(product)], null, 100);

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/products?offset=0&limit=20')
        .expect(200);

      expect(res.body.hasMore).toBe(true);
      expect(res.body.totalCount).toBe(100);
    });
  });
});
