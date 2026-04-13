import { ApiError } from './api-error';

export type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export interface ApiClientOptions {
  baseUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

export interface ApiClient {
  get: <T>(path: string, opts?: RequestOptions) => Promise<T>;
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => Promise<T>;
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => Promise<T>;
  delete: <T>(path: string, opts?: RequestOptions) => Promise<T>;
}

export function createApiClient({ baseUrl, getAuthHeaders }: ApiClientOptions): ApiClient {
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, body.message ?? res.statusText);
    }

    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>(path, { ...opts, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>(path, { ...opts, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string, opts?: RequestOptions) =>
      request<T>(path, { ...opts, method: 'DELETE' }),
  };
}
