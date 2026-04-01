import { afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp, type TestApp, authHeader } from '../helpers';

describe('Auth (e2e)', () => {
  let testApp: TestApp;

  afterEach(async () => {
    await testApp?.close();
  });

  describe('GET /auth/me', () => {
    it('returns 200 with user payload when authenticated', async () => {
      testApp = await createTestApp({
        auth: { authUser: { id: 'user-1', email: 'user@example.com', role: 'Vendor' } },
      });

      const res = await request(testApp.app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', authHeader('user-1'))
        .expect(200);

      expect(res.body).toMatchObject({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'Vendor',
        },
      });
    });

    it('returns 401 without auth header', async () => {
      testApp = await createTestApp();

      await request(testApp.app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('returns 401 with invalid token', async () => {
      testApp = await createTestApp({ auth: { authUser: null } });

      await request(testApp.app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer bad-token')
        .expect(401);
    });
  });

  describe('GET /auth/vendor-check', () => {
    it('returns 200 for Vendor role', async () => {
      testApp = await createTestApp({
        auth: { authUser: { id: 'v1', role: 'Vendor' } },
      });

      const res = await request(testApp.app.getHttpServer())
        .get('/auth/vendor-check')
        .set('Authorization', authHeader('v1'))
        .expect(200);

      expect(res.body).toMatchObject({ allowed: true });
    });

    it('returns 200 for Admin role', async () => {
      testApp = await createTestApp({
        auth: { authUser: { id: 'a1', role: 'Admin' } },
      });

      await request(testApp.app.getHttpServer())
        .get('/auth/vendor-check')
        .set('Authorization', authHeader('a1'))
        .expect(200);
    });

    it('returns 403 for Customer role', async () => {
      testApp = await createTestApp({
        auth: { authUser: { id: 'c1', role: 'Customer' } },
      });

      await request(testApp.app.getHttpServer())
        .get('/auth/vendor-check')
        .set('Authorization', authHeader('c1'))
        .expect(403);
    });
  });
});
