import type { UserResponse } from '@ecomsaas/contracts';
import type { UserAccountModel } from '@ecomsaas/domain';

export function toUserResponse(user: UserAccountModel): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    defaultLocale: user.defaultLocale,
    accountTier: user.accountTier,
    accountStatus: user.accountStatus,
    role: user.role,
    verificationStatus: user.verificationStatus,
    preferences: user.preferences,
    metadata: user.metadata,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
