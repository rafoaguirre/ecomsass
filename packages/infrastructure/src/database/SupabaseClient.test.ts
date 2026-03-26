import { describe, expect, it } from 'vitest';
import { createSupabaseClient } from './SupabaseClient';

describe('createSupabaseClient', () => {
  it('should create a client with the provided URL and key', () => {
    const client = createSupabaseClient({
      url: 'http://localhost:54321',
      key: 'test-anon-key',
    });

    // The Supabase client exposes .from() for table queries
    expect(typeof client.from).toBe('function');
    expect(typeof client.auth).toBe('object');
    expect(typeof client.storage).toBe('object');
  });
});
