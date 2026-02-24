import type { AccountTier } from '@ecomsaas/domain/enums';

/**
 * Sign up request
 */
export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  accountTier?: AccountTier;
  defaultLocale?: string;
  marketingConsent?: boolean;
}
