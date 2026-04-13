import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  createTestApp,
  type TestApp,
  buildVendorProfile,
  resetFactories,
  authHeader,
} from '../helpers';

/**
 * Convert a VendorProfile entity to the Supabase DB row format
 * returned by `from('vendor_profiles').select('*')`.
 */
function toVendorProfileRow(profile: ReturnType<typeof buildVendorProfile>) {
  return {
    id: profile.id,
    user_id: profile.userId,
    business_name: profile.businessName,
    phone: profile.phone ?? null,
    phone_country_code: profile.phoneCountryCode ?? null,
    addresses: profile.addresses,
    verification_status: profile.verificationStatus,
    stripe_connect_id: profile.stripeConnectId ?? null,
    agreement_accepted: profile.agreementAccepted,
    onboarding_completed: profile.onboardingCompleted,
    metadata: profile.metadata,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  };
}

describe('Vendors (e2e)', () => {
  const USER_ID = 'vendor-user-1';

  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({
      auth: { authUser: { id: USER_ID, role: 'Vendor' } },
    });
  });

  afterAll(async () => {
    await testApp?.close();
  });

  beforeEach(() => {
    resetFactories();
  });

  // ── POST /api/v1/vendors ──────────────────────────────────────────

  describe('POST /api/v1/vendors', () => {
    it('returns 201 when creating a vendor profile', async () => {
      const profile = buildVendorProfile({ userId: USER_ID });
      // findByUserId check → no existing profile
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: null, error: null })
      );
      // save (upsert) returns the new profile
      testApp.supabaseClient.__queryBuilder.single.mockImplementationOnce(() =>
        Promise.resolve({ data: toVendorProfileRow(profile), error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/vendors')
        .set('Authorization', authHeader(USER_ID))
        .send({ businessName: 'Test Business' })
        .expect(201);

      expect(res.body).toMatchObject({
        businessName: 'Test Business',
        userId: USER_ID,
      });
    });

    it('returns 401 without auth header', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/vendors')
        .send({ businessName: 'Test' })
        .expect(401);
    });

    it('returns 400 for missing businessName', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/vendors')
        .set('Authorization', authHeader(USER_ID))
        .send({})
        .expect(400);
    });

    it('returns 400 when user already has a vendor profile', async () => {
      const existing = buildVendorProfile({ userId: USER_ID });
      // findByUserId check → existing profile found
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toVendorProfileRow(existing), error: null })
      );

      await request(testApp.app.getHttpServer())
        .post('/api/v1/vendors')
        .set('Authorization', authHeader(USER_ID))
        .send({ businessName: 'Duplicate' })
        .expect(400);
    });
  });

  // ── GET /api/v1/vendors/me ────────────────────────────────────────

  describe('GET /api/v1/vendors/me', () => {
    it('returns 200 with vendor profile for current user', async () => {
      const profile = buildVendorProfile({ userId: USER_ID });
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toVendorProfileRow(profile), error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/vendors/me')
        .set('Authorization', authHeader(USER_ID))
        .expect(200);

      expect(res.body).toMatchObject({
        userId: USER_ID,
        businessName: 'Test Business',
      });
    });

    it('returns 404 when no vendor profile exists', async () => {
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: null, error: null })
      );

      await request(testApp.app.getHttpServer())
        .get('/api/v1/vendors/me')
        .set('Authorization', authHeader(USER_ID))
        .expect(404);
    });

    it('returns 401 without auth header', async () => {
      await request(testApp.app.getHttpServer()).get('/api/v1/vendors/me').expect(401);
    });
  });

  // ── GET /api/v1/vendors/:id ───────────────────────────────────────

  describe('GET /api/v1/vendors/:id', () => {
    it('returns 200 with vendor profile for owner', async () => {
      const profile = buildVendorProfile({
        id: '00000000-0000-4000-a000-000000000001',
        userId: USER_ID,
      });
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toVendorProfileRow(profile), error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/vendors/00000000-0000-4000-a000-000000000001')
        .set('Authorization', authHeader(USER_ID))
        .expect(200);

      expect(res.body).toMatchObject({
        id: '00000000-0000-4000-a000-000000000001',
        businessName: 'Test Business',
      });
    });

    it('returns 403 when vendor reads another vendor profile', async () => {
      const otherProfile = buildVendorProfile({
        id: '00000000-0000-4000-a000-000000000099',
        userId: 'other-vendor-user',
      });
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toVendorProfileRow(otherProfile), error: null })
      );

      await request(testApp.app.getHttpServer())
        .get('/api/v1/vendors/00000000-0000-4000-a000-000000000099')
        .set('Authorization', authHeader(USER_ID))
        .expect(403);
    });

    it('returns 400 when id is not a valid UUID', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/vendors/not-a-uuid')
        .set('Authorization', authHeader(USER_ID))
        .expect(400);
    });

    it('returns 403 for non-vendor role', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/vendors/00000000-0000-4000-a000-000000000002')
        .set('Authorization', authHeader('regular-user', { role: 'Customer' }))
        .expect(403);
    });
  });

  // ── PUT /api/v1/vendors/:id ───────────────────────────────────────

  describe('PUT /api/v1/vendors/:id', () => {
    it('returns 200 with updated vendor profile', async () => {
      const profile = buildVendorProfile({
        id: '00000000-0000-4000-a000-000000000001',
        userId: USER_ID,
        businessName: 'Updated Business',
      });
      // ownership check: getById
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toVendorProfileRow(profile), error: null })
      );
      // updateVendorProfile findById
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toVendorProfileRow(profile), error: null })
      );
      // save (upsert)
      testApp.supabaseClient.__queryBuilder.single.mockImplementationOnce(() =>
        Promise.resolve({ data: toVendorProfileRow(profile), error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .put('/api/v1/vendors/00000000-0000-4000-a000-000000000001')
        .set('Authorization', authHeader(USER_ID))
        .send({ businessName: 'Updated Business' })
        .expect(200);

      expect(res.body).toMatchObject({
        businessName: 'Updated Business',
      });
    });

    it('returns 401 without auth header', async () => {
      await request(testApp.app.getHttpServer())
        .put('/api/v1/vendors/00000000-0000-4000-a000-000000000001')
        .send({ businessName: 'Nope' })
        .expect(401);
    });

    it('returns 400 when id is not a valid UUID', async () => {
      await request(testApp.app.getHttpServer())
        .put('/api/v1/vendors/not-a-uuid')
        .set('Authorization', authHeader(USER_ID))
        .send({ businessName: 'Test' })
        .expect(400);
    });
  });
});
