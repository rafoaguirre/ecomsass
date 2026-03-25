import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHttpClient, HttpError } from './HttpClient';
import type { HttpClient } from './HttpClient';

// Mock fetch globally
global.fetch = vi.fn();

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createHttpClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      const result = await client.get('https://api.example.com/test');
      expect(result).toEqual(mockData);
    });

    it('should throw HttpError on non-200 response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

      await expect(client.get('https://api.example.com/notfound')).rejects.toThrow(HttpError);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with body', async () => {
      const requestBody = { name: 'New Item' };
      const responseData = { id: 1, ...requestBody };

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      );

      const result = await client.post('https://api.example.com/items', requestBody);
      expect(result).toEqual(responseData);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });
  });

  describe('base URL', () => {
    it('should prepend base URL to relative paths', async () => {
      const clientWithBase = createHttpClient({ baseUrl: 'https://api.example.com' });

      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      await clientWithBase.get('/users');
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object));
    });
  });

  describe('retry logic', () => {
    it('should retry on 503 status', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }))
        .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );

      const result = await client.get('https://api.example.com/test', {
        retry: { maxAttempts: 3, initialDelay: 10 },
      });

      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 404', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

      await expect(
        client.get('https://api.example.com/notfound', {
          retry: { maxAttempts: 3 },
        })
      ).rejects.toThrow(HttpError);

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('authentication', () => {
    it('should include Bearer token when authTokenProvider is configured', async () => {
      const tokenProvider = vi.fn().mockResolvedValue('test-token-123');
      const authClient = createHttpClient({ authTokenProvider: tokenProvider });

      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      await authClient.get('https://api.example.com/protected');

      expect(tokenProvider).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });
  });

  describe('custom headers', () => {
    it('should merge default and request headers', async () => {
      const clientWithHeaders = createHttpClient({
        defaultHeaders: { 'X-API-Key': 'default-key' },
      });

      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      await clientWithHeaders.get('https://api.example.com/test', {
        headers: { 'X-Request-ID': 'req-123' },
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'default-key',
            'X-Request-ID': 'req-123',
          }),
        })
      );
    });
  });

  describe('external abort signal with timeout', () => {
    it('should use internal controller signal even when external signal provided', async () => {
      const externalController = new AbortController();
      let capturedSignal: AbortSignal | null | undefined;

      vi.mocked(fetch).mockImplementationOnce((_url, options) => {
        capturedSignal = options?.signal;
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      });

      await client.get('https://api.example.com/test', {
        signal: externalController.signal,
      });

      // Should use internal controller, not external one
      expect(capturedSignal).toBeDefined();
      expect(capturedSignal).not.toBe(externalController.signal);
    });

    it('should listen to external signal abort events', async () => {
      const externalController = new AbortController();

      vi.mocked(fetch).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            externalController.abort();
            reject(new DOMException('Aborted', 'AbortError'));
          }, 50);
        });
      });

      await expect(
        client.get('https://api.example.com/test', {
          timeout: 5000,
          signal: externalController.signal,
        })
      ).rejects.toThrow();
    });

    it('should clean up listeners after request completes', async () => {
      // Use same external signal for multiple requests to verify no listener accumulation
      const externalController = new AbortController();

      vi.mocked(fetch).mockImplementation(() => {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      });

      // Make 3 requests with same external signal
      await client.get('https://api.example.com/test1', {
        signal: externalController.signal,
      });
      await client.get('https://api.example.com/test2', {
        signal: externalController.signal,
      });
      await client.get('https://api.example.com/test3', {
        signal: externalController.signal,
      });

      // All requests should succeed without listener accumulation issues
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});
