import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ProductRepository,
  StoreRepository,
  VendorProfileRepository,
} from '@ecomsaas/application/ports';
import type { OrderModel, StoreModel } from '@ecomsaas/domain';
import type { AuthUser } from '../../auth/types/auth-user';
import { STORE_REPOSITORY } from '../../stores/store.tokens';
import { VENDOR_PROFILE_REPOSITORY } from '../../vendors/vendor.tokens';

@Injectable()
export class OwnershipVerifier {
  constructor(
    @Inject(STORE_REPOSITORY) private readonly storeRepository: StoreRepository,
    @Inject(VENDOR_PROFILE_REPOSITORY)
    private readonly vendorProfileRepository: VendorProfileRepository
  ) {}

  /**
   * Resolve the vendor_profiles.id for a given auth user.
   * Caches the result on the AuthUser object to avoid repeated DB lookups.
   */
  async resolveVendorProfileId(user: AuthUser): Promise<string> {
    if (user.vendorProfileId) {
      return user.vendorProfileId;
    }
    const result = await this.vendorProfileRepository.findByUserId(user.id);
    if (result.isErr()) {
      throw new NotFoundException('Vendor profile not found for this user');
    }
    user.vendorProfileId = result.value.id;
    return result.value.id;
  }

  /**
   * Verify that the user owns the store identified by storeId.
   * Admin users bypass this check.
   */
  async verifyStoreOwnership(storeId: string, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;
    const vendorProfileId = await this.resolveVendorProfileId(user);
    const storeResult = await this.storeRepository.findById(storeId);
    if (storeResult.isErr()) throw storeResult.error;
    if (storeResult.value.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  /**
   * Verify ownership when the store model is already loaded.
   * Admin users bypass this check.
   */
  async assertStoreOwnership(store: StoreModel, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;
    const vendorProfileId = await this.resolveVendorProfileId(user);
    if (store.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  /**
   * Verify that the user owns the product (via its parent store).
   * Admin users bypass this check.
   */
  async verifyProductOwnership(
    productId: string,
    user: AuthUser,
    productRepository: ProductRepository
  ): Promise<void> {
    if (user.role === 'Admin') return;
    const result = await productRepository.findById(productId);
    if (result.isErr()) throw result.error;
    await this.verifyStoreOwnership(result.value.storeId, user);
  }

  /**
   * Verify that the user has access to an order.
   * - Admin: always allowed
   * - Customer: only their own orders
   * - Vendor: only orders for stores they own
   */
  async assertOrderAccess(order: OrderModel, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;
    if (order.userId === user.id) return;
    if (user.role === 'Vendor') {
      const vendorProfileId = await this.resolveVendorProfileId(user);
      const storeResult = await this.storeRepository.findById(order.storeId);
      if (storeResult.isOk() && storeResult.value.vendorProfileId === vendorProfileId) return;
    }
    throw new ForbiddenException('You do not have access to this order');
  }
}
