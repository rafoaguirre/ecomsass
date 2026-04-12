import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  NotFoundError,
  ValidationError,
  PermissionError,
  InvariantError,
  ConcurrencyError,
  QuotaExceededError,
} from '@ecomsaas/domain';
import { GlobalExceptionFilter } from './global-exception.filter';

function createMockHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = { status };
  const request = { method: 'GET', url: '/test' };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  };

  return { host, json, status } as {
    host: Parameters<GlobalExceptionFilter['catch']>[1];
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    // Suppress logger output in tests that intentionally trigger 500s
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps HttpException to its status', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new HttpException('Bad Request', HttpStatus.BAD_REQUEST), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: 'Bad Request' })
    );
  });

  it('maps NotFoundError to 404', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new NotFoundError('Store', 'abc'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        code: 'NOT_FOUND',
        details: { resource: 'Store', identifier: 'abc' },
      })
    );
  });

  it('maps ValidationError to 400', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new ValidationError('Invalid name', { field: 'name' }), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details: { field: 'name' },
      })
    );
  });

  it('maps PermissionError to 403', () => {
    const { host, status } = createMockHost();
    filter.catch(new PermissionError('Not allowed'), host);
    expect(status).toHaveBeenCalledWith(403);
  });

  it('maps InvariantError to 422', () => {
    const { host, status } = createMockHost();
    filter.catch(new InvariantError('Business rule violated'), host);
    expect(status).toHaveBeenCalledWith(422);
  });

  it('maps ConcurrencyError to 409', () => {
    const { host, status } = createMockHost();
    filter.catch(new ConcurrencyError('Stale data'), host);
    expect(status).toHaveBeenCalledWith(409);
  });

  it('maps QuotaExceededError to 429', () => {
    const { host, status } = createMockHost();
    filter.catch(new QuotaExceededError('stores', 5, 5), host);
    expect(status).toHaveBeenCalledWith(429);
  });

  it('falls back to 500 for unknown errors', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new Error('Something unexpected'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Internal server error' })
    );
  });

  it('does not include code/details for non-domain errors', () => {
    const { host, json } = createMockHost();
    filter.catch(new Error('oops'), host);

    const body = json.mock.calls[0]![0];
    expect(body.code).toBeUndefined();
    expect(body.details).toBeUndefined();
  });
});
