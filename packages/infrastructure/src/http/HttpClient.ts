/**
 * HTTP client interface for dependency injection.
 */
export interface HttpClient {
  get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
  post<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;
  put<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;
  patch<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;
  delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
}

/**
 * HTTP request options.
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retry?: RetryOptions;
  signal?: AbortSignal;
}

/**
 * Retry configuration.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay between retries in milliseconds
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Backoff multiplier for each retry
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * HTTP status codes that should trigger a retry
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryableStatusCodes?: number[];
}

/**
 * HTTP client configuration.
 */
export interface HttpClientConfig {
  /**
   * Base URL for all requests
   */
  baseUrl?: string;

  /**
   * Default headers to include in all requests
   */
  defaultHeaders?: Record<string, string>;

  /**
   * Default timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Default retry configuration
   */
  retry?: RetryOptions;

  /**
   * Authentication token generator (useful for Bearer tokens)
   */
  authTokenProvider?: () => Promise<string>;
}

/**
 * HTTP error class with status code and response data.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Fetch-based HTTP client with retry logic.
 */
export class FetchHttpClient implements HttpClient {
  private readonly defaultRetry: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  };

  constructor(private readonly config: HttpClientConfig = {}) {}

  async get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('POST', url, body, options);
  }

  async put<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('PUT', url, body, options);
  }

  async patch<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('PATCH', url, body, options);
  }

  async delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options?: HttpRequestOptions
  ): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const headers = await this.buildHeaders(options?.headers);
    const timeout = options?.timeout || this.config.timeout || 30000;
    const retry = { ...this.defaultRetry, ...this.config.retry, ...options?.retry };

    return this.executeWithRetry(
      () => this.performRequest<T>(fullUrl, method, body, headers, timeout, options?.signal),
      retry
    );
  }

  /**
   * Execute a request with retry logic (extracted for SRP).
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retry: Required<RetryOptions>
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retry.maxAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on non-retryable errors
        if (error instanceof HttpError && !retry.retryableStatusCodes.includes(error.status)) {
          throw error;
        }

        // Delay before retry (except on last attempt)
        if (attempt < retry.maxAttempts - 1) {
          await this.delay(retry.initialDelay * Math.pow(retry.backoffMultiplier, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Perform the actual HTTP request (extracted for clarity).
   */
  private async performRequest<T>(
    url: string,
    method: string,
    body: unknown,
    headers: Record<string, string>,
    timeout: number,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // If external signal is provided, abort our controller when it aborts
    // Store handler reference for cleanup
    const externalAbortHandler = signal ? () => controller.abort() : undefined;

    if (signal && externalAbortHandler) {
      signal.addEventListener('abort', externalAbortHandler, { once: true });
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal, // Always use our controller
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      return this.parseResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
      // Clean up external signal listener if request completed without external abort
      if (signal && externalAbortHandler && !signal.aborted) {
        signal.removeEventListener('abort', externalAbortHandler);
      }
    }
  }

  /**
   * Parse response based on content type (extracted for clarity).
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (this.config.baseUrl) {
      const base = this.config.baseUrl.endsWith('/')
        ? this.config.baseUrl.slice(0, -1)
        : this.config.baseUrl;
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    }

    return url;
  }

  private async buildHeaders(
    requestHeaders?: Record<string, string>
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.defaultHeaders,
      ...requestHeaders,
    };

    // Add auth token if provider is configured
    if (this.config.authTokenProvider) {
      const token = await this.config.authTokenProvider();
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create an HTTP client with optional configuration.
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new FetchHttpClient(config);
}
