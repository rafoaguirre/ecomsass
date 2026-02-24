import type { UserAccount } from '@ecomsaas/domain/entities';

/**
 * Authentication response
 */
export interface AuthResponse {
  user: UserAccount;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
