import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, type TestApp } from '../helpers';

describe('Health (e2e)', () => {
  let testApp: TestApp;

  afterAll(async () => {
    await testApp?.close();
  });

  it('GET /health returns 200 with status ok', async () => {
    testApp = await createTestApp();

    const res = await request(testApp.app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.timestamp).toBeDefined();
  });
});
