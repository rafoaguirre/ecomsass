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
      // Override auth to return a non-vendor user for this request
      testApp.supabaseAnonClient.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'regular-user',
            email: 'user@example.com',
            app_metadata: { role: 'Customer' },
          },
        },
        error: null,
      });

      await request(testApp.app.getHttpServer())
        .get('/api/v1/stores/vendor/any-store')
        .set('Authorization', authHeader('regular-user'))
        .expect(403);
    });
  });
});
