/**
 * Link type defines the relationship between entities
 */
export type LinkType =
  | 'customer'
  | 'follower'
  | 'contact'
  | 'staff'
  | 'donor'
  | 'friend'
  | 'student'
  | 'co-guardian'
  | 'parent'
  | 'organization';

/**
 * Link status
 */
export type LinkStatus = 'expired' | 'unverified' | 'verified' | 'active' | 'rejected';

/**
 * Link entity - represents relationships between users/stores
 */
export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  status: LinkStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
