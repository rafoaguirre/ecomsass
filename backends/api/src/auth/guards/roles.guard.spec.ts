import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard';

function createHttpExecutionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows when no roles are required', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);
    const result = guard.canActivate(createHttpExecutionContext({ user: { role: 'Vendor' } }));

    expect(result).toBe(true);
  });

  it('allows when user role matches', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['Vendor', 'Admin']),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);
    const result = guard.canActivate(createHttpExecutionContext({ user: { role: 'Vendor' } }));

    expect(result).toBe(true);
  });

  it('throws when user role does not match', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['Admin']),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(createHttpExecutionContext({ user: { role: 'Vendor' } }))
    ).toThrow(ForbiddenException);
  });
});
