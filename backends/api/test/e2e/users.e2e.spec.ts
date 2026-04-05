import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, type TestApp, buildUser, resetFactories, authHeader } from '../helpers';

/**
 * Convert a UserAccount entity to the Supabase DB row format
 * returned by `from('profiles').select('*')`.
 */
function toProfileRow(user: ReturnType<typeof buildUser>) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    default_locale: user.defaultLocale,
    account_tier: user.accountTier,
    account_status: user.accountStatus,
    role: user.role,
    stripe_customer_id: user.stripeCustomerId,
    marketing_consent: user.marketingConsent,
    agreement_accepted: user.agreementAccepted,
    verification_status: user.verificationStatus,
    preferences: user.preferences,
    metadata: user.metadata,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

describe('Users (e2e)', () => {
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

  // ── GET /api/v1/users/me ──────────────────────────────────────────

  describe('GET /api/v1/users/me', () => {
    it('returns 200 with current user profile', async () => {
      const user = buildUser({ id: USER_ID, email: 'vendor@example.com' });
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toProfileRow(user), error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', authHeader(USER_ID))
        .expect(200);

      expect(res.body).toMatchObject({
        id: USER_ID,
        email: 'vendor@example.com',
        fullName: 'Test User',
      });
    });

    it('returns 404 when user profile does not exist', async () => {
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: null, error: null })
      );

      await request(testApp.app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', authHeader(USER_ID))
        .expect(404);
    });

    it('returns 401 without auth header', async () => {
      await request(testApp.app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });
  });

  // ── PUT /api/v1/users/me ──────────────────────────────────────────

  describe('PUT /api/v1/users/me', () => {
    it('returns 200 with updated user profile', async () => {
      const user = buildUser({ id: USER_ID, fullName: 'Updated Name' });
      // findById for the update use case
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toProfileRow(user), error: null })
      );
      // save (upsert) returns the updated row
      testApp.supabaseClient.__queryBuilder.single.mockImplementationOnce(() =>
        Promise.resolve({ data: toProfileRow(user), error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', authHeader(USER_ID))
        .send({ fullName: 'Updated Name' })
        .expect(200);

      expect(res.body).toMatchObject({
        fullName: 'Updated Name',
      });
    });

    it('returns 401 without auth header', async () => {
      await request(testApp.app.getHttpServer())
        .put('/api/v1/users/me')
        .send({ fullName: 'Nope' })
        .expect(401);
    });

    it('returns 400 for invalid body', async () => {
      await request(testApp.app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', authHeader(USER_ID))
        .send({ fullName: '' })
        .expect(400);
    });

    it('updates user preferences', async () => {
      const user = buildUser({
        id: USER_ID,
        preferences: { emailNotifications: false, smsNotifications: true, marketingEmails: false },
      });
      testApp.supabaseClient.__queryBuilder.maybeSingle.mockImplementationOnce(() =>
        Promise.resolve({ data: toProfileRow(user), error: null })
      );
      testApp.supabaseClient.__queryBuilder.single.mockImplementationOnce(() =>
        Promise.resolve({ data: toProfileRow(user), error: null })
      );

      const res = await request(testApp.app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', authHeader(USER_ID))
        .send({ preferences: { emailNotifications: false, smsNotifications: true } })
        .expect(200);

      expect(res.body.preferences).toMatchObject({
        emailNotifications: false,
        smsNotifications: true,
      });
    });
  });
});
