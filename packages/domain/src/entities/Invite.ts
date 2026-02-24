import type { UserRole, StoreAccessLevel } from '../enums';

/**
 * Invite status
 */
export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

/**
 * Invite entity
 */
export interface Invite {
  id: string;
  inviterId: string;
  email: string;
  role: UserRole;
  storeId?: string;
  storeAccessLevel?: StoreAccessLevel;
  status: InviteStatus;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
