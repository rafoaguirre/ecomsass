import { describe, expect, it } from 'vitest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('returns the current user payload', () => {
    const controller = new AuthController();

    const result = controller.me({
      id: 'user-1',
      email: 'user@example.com',
      role: 'Vendor',
    });

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        role: 'Vendor',
      },
    });
  });

  it('returns allowed payload for vendor-check', () => {
    const controller = new AuthController();

    const result = controller.vendorCheck({
      id: 'user-1',
      email: 'vendor@example.com',
      role: 'Vendor',
    });

    expect(result).toEqual({
      allowed: true,
      user: {
        id: 'user-1',
        email: 'vendor@example.com',
        role: 'Vendor',
      },
    });
  });
});
