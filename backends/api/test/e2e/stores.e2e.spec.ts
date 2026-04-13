import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, type TestApp, buildStore, resetFactories, authHeader } from '../helpers';

/**
 * Converts a Store entity to what the Supabase `.from('stores').select('*,
 * vendor_profiles!inner(business_name)')` would return (snake_case row).
 */
function toStoreRow(store: ReturnType<typeof buildStore>) {
  return {
    id: store.id,
    vendor_profile_id: store.vendorProfileId,
    name: store.name,
    description: store.description ?? null,
    email: store.email ?? null,
    phone_number: store.phoneNumber ?? null,
    phone_country_code: store.phoneCountryCode ?? null,
    address: store.address,
    slug: store.slug,
    store_type: store.storeType,
    is_active: store.isActive,
    operating_hours: store.operatingHours ?? null,
    metadata: store.metadata,
    created_at: store.createdAt.toISOString(),
    updated_at: store.updatedAt.toISOString(),
    vendor_profiles: {
      business_name:
        typeof store.metadata.vendorName === 'string' ? store.metadata.vendorName : null,
    },
  };
}

describe('Stores (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({
      auth: { authUser: { id: 'vendor-user-1', role: 'Vendor' } },
    });
  });

  afterAll(async () => {
    await testApp?.close();
  });

  beforeEach(() => {
    resetFactories();
  });

  // ── Public endpoint: GET /api/v1/stores/slug/:slug ─────────────────

  describe('GET /api/v1/stores/slug/:slug', () => {
    it('returns 200 with store data when store is active', async () => {
      const store = buildStore({ slug: 'demo-store', isActive: true });
      testApp.supabaseClient.__setQueryResult(toStoreRow(store));

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/stores/slug/demo-store')
        .expect(200);

      expect(res.body).toMatchObject({
        slug: 'demo-store',
        name: 'Test Store',
        isActive: true,
        vendorName: 'Test Vendor',
      });
      // Sensitive fields must not leak to public consumers
      expect(res.body).not.toHaveProperty('vendorProfileId');
      expect(res.body).not.toHaveProperty('email');
      expect(res.body).not.toHaveProperty('phoneNumber');
      expect(res.body).not.toHaveProperty('phoneCountryCode');
      expect(res.body).not.toHaveProperty('metadata');
    });

    it('returns 404 when store does not exist', async () => {
      testApp.supabaseClient.__setQueryResult(null);

      await request(testApp.app.getHttpServer()).get('/api/v1/stores/slug/nonexistent').expect(404);
    });

    it('returns 404 when store is inactive', async () => {
      const store = buildStore({ slug: 'closed-store', isActive: false });
      testApp.supabaseClient.__setQueryResult(toStoreRow(store));

      await request(testApp.app.getHttpServer())
        .get('/api/v1/stores/slug/closed-store')
        .expect(404);
    });

    it('returns 400 for invalid slug format', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/stores/slug/INVALID%20SLUG!')
        .expect(400);
    });
  });

  // ── Vendor endpoint: GET /api/v1/stores/vendor/:slug ───────────────

  describe('GET /api/v1/stores/vendor/:slug', () => {
    it('returns 200 for authenticated vendor even when store is inactive', async () => {
      const store = buildStore({
        slug: 'vendor-store',
        isActive: false,
        vendorProfileId: 'vendor-user-1',
      });
      testApp.supabaseClient.__setQueryResult(toStoreRow(store));

      // Vendor profile lookup for ownership check
      testApp.supabaseClient.__queryBuilder.maybeSingle
        .mockImplementationOnce(() => Promise.resolve({ data: toStoreRow(store), error: null }))
        .mockImplementationOnce(() =>
          Promise.resolve({
            data: {
              id: 'vendor-user-1',
              user_id: 'vendor-user-1',
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
        );

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/stores/vendor/vendor-store')
        .set('Authorization', authHeader('vendor-user-1'))
        .expect(200);

      expect(res.body).toMatchObject({
        slug: 'vendor-store',
        isActive: false,
      });
      // Vendor/admin endpoint returns full payload including sensitive fields
      expect(res.body).toHaveProperty('vendorProfileId');
      expect(res.body).toHaveProperty('metadata');
    });

    it('returns 401 without auth header', async () => {
      await request(testApp.app.getHttpServer()).get('/api/v1/stores/vendor/any-store').expect(401);
    });

    it('returns 403 for non-vendor role', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/stores/vendor/any-store')
        .set('Authorization', authHeader('regular-user', { role: 'Customer' }))
        .expect(403);
    });
  });

  // ── Public endpoint: GET /api/v1/stores (search/list) ──────────────

  describe('GET /api/v1/stores', () => {
    it('returns 200 with paginated store list', async () => {
      const store = buildStore({ name: 'Cool Store', isActive: true });
      const row = toStoreRow(store);
      testApp.supabaseClient.__setQueryResult([row], null, 1);

      const res = await request(testApp.app.getHttpServer()).get('/api/v1/stores').expect(200);

      expect(res.body).toMatchObject({
        stores: [expect.objectContaining({ name: 'Cool Store' })],
        totalCount: 1,
        hasMore: false,
      });
    });

    it('returns empty list when no stores match', async () => {
      testApp.supabaseClient.__setQueryResult([], null, 0);

      const res = await request(testApp.app.getHttpServer()).get('/api/v1/stores').expect(200);

      expect(res.body).toMatchObject({
        stores: [],
        totalCount: 0,
        hasMore: false,
      });
    });

    it('passes query params through to Supabase client', async () => {
      testApp.supabaseClient.__setQueryResult([], null, 0);

      await request(testApp.app.getHttpServer())
        .get(
          '/api/v1/stores?q=coffee&storeType=RESTAURANT&sortBy=name&sortDirection=asc&offset=10&limit=5'
        )
        .expect(200);

      expect(testApp.supabaseClient.__queryBuilder.ilike).toHaveBeenCalledWith('name', '%coffee%');
      expect(testApp.supabaseClient.__queryBuilder.eq).toHaveBeenCalledWith(
        'store_type',
        'RESTAURANT'
      );
      expect(testApp.supabaseClient.__queryBuilder.order).toHaveBeenCalledWith('name', {
        ascending: true,
      });
    });

    it('returns hasMore=true when more results exist', async () => {
      const store = buildStore({ isActive: true });
      testApp.supabaseClient.__setQueryResult([toStoreRow(store)], null, 50);

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/stores?offset=0&limit=20')
        .expect(200);

      expect(res.body.hasMore).toBe(true);
      expect(res.body.totalCount).toBe(50);
    });
  });
});
