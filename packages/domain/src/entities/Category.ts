import type { CategoryType } from '../enums';
import type { Image } from '../value-objects';

/**
 * Category entity
 */
export interface Category {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  type: CategoryType;
  parentId?: string;
  image?: Image;
  displayOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
