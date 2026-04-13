import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PlaceOrder,
  GetOrder,
  ListOrders,
  UpdateOrderStatus,
  type PlaceOrderInput,
  type UpdateOrderStatusInput,
} from '@ecomsaas/application/use-cases';
import type {
  OrderRepository,
  StoreRepository,
  VendorProfileRepository,
} from '@ecomsaas/application/ports';
import type { OrderModel, OrderStatus } from '@ecomsaas/domain';
import type { OrderResponse, OrderSummary } from '@ecomsaas/contracts';
import type { AuthUser } from '../auth/types/auth-user';
import { ORDER_REPOSITORY } from './order.tokens';
import { STORE_REPOSITORY } from '../stores/store.tokens';
import { VENDOR_PROFILE_REPOSITORY } from '../vendors/vendor.tokens';
import { toOrderResponse, toOrderSummary } from './dto/order.mapper';
import { clampOffset, clampPageSize } from '../common/database';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PlaceOrder) private readonly placeOrder: PlaceOrder,
    @Inject(GetOrder) private readonly getOrder: GetOrder,
    @Inject(ListOrders) private readonly listOrders: ListOrders,
    @Inject(UpdateOrderStatus) private readonly updateOrderStatus: UpdateOrderStatus,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
    @Inject(STORE_REPOSITORY) private readonly storeRepository: StoreRepository,
    @Inject(VENDOR_PROFILE_REPOSITORY)
    private readonly vendorProfileRepository: VendorProfileRepository
  ) {}

  async create(
    storeId: string,
    input: Omit<PlaceOrderInput, 'storeId' | 'userId'>,
    user: AuthUser
  ): Promise<OrderResponse> {
    const result = await this.placeOrder.execute({
      storeId,
      userId: user.id,
      ...input,
    });

    if (result.isErr()) {
      throw result.error;
    }

    return this.enrichOrder(result.value);
  }

  async getById(id: string, user: AuthUser): Promise<OrderResponse> {
    const result = await this.getOrder.execute({ id, identifierType: 'id' });

    if (result.isErr()) {
      throw result.error;
    }

    const order = result.value;
    await this.assertAccess(order, user);
    return this.enrichOrder(order);
  }

  async listForCustomer(
    user: AuthUser,
    options?: { status?: OrderStatus; offset?: number; limit?: number }
  ): Promise<OrderSummary[]> {
    const orders = await this.listOrders.execute({
      userId: user.id,
      status: options?.status,
      offset: clampOffset(options?.offset),
      limit: clampPageSize(options?.limit),
    });

    return orders.map(toOrderSummary);
  }

  async listForStore(
    storeId: string,
    user: AuthUser,
    options?: { status?: OrderStatus; offset?: number; limit?: number }
  ): Promise<OrderSummary[]> {
    await this.verifyStoreOwnership(storeId, user);

    const orders = await this.listOrders.execute({
      storeId,
      status: options?.status,
      offset: clampOffset(options?.offset),
      limit: clampPageSize(options?.limit),
    });

    return orders.map(toOrderSummary);
  }

  async updateStatus(
    orderId: string,
    input: Omit<UpdateOrderStatusInput, 'orderId'>,
    user: AuthUser
  ): Promise<OrderResponse> {
    // Verify the user has access to this order (vendor must own the store)
    const findResult = await this.orderRepository.findById(orderId);
    if (findResult.isErr()) {
      throw findResult.error;
    }

    const order = findResult.value;
    await this.verifyStoreOwnership(order.storeId, user);

    const result = await this.updateOrderStatus.execute({
      orderId,
      ...input,
    });

    if (result.isErr()) {
      throw result.error;
    }

    return this.enrichOrder(result.value);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async assertAccess(order: OrderModel, user: AuthUser): Promise<void> {
    // Admin can view all orders
    if (user.role === 'Admin') return;
    // Customers can view their own orders
    if (order.userId === user.id) return;
    // Vendors can view orders for stores they own
    if (user.role === 'Vendor') {
      const vendorProfileId = await this.resolveVendorProfileId(user);
      const storeResult = await this.storeRepository.findById(order.storeId);
      if (storeResult.isOk() && storeResult.value.vendorProfileId === vendorProfileId) return;
    }
    throw new ForbiddenException('You do not have access to this order');
  }

  private async verifyStoreOwnership(storeId: string, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;
    const vendorProfileId = await this.resolveVendorProfileId(user);
    const storeResult = await this.storeRepository.findById(storeId);
    if (storeResult.isErr()) throw storeResult.error;
    const store = storeResult.value;
    if (store.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  private async resolveVendorProfileId(user: AuthUser): Promise<string> {
    const result = await this.vendorProfileRepository.findByUserId(user.id);
    if (result.isErr()) {
      throw new NotFoundException('Vendor profile not found for this user');
    }
    return result.value.id;
  }

  private async enrichOrder(order: OrderModel): Promise<OrderResponse> {
    // Fetch store name for the response
    let storeName = 'Unknown Store';
    const storeResult = await this.storeRepository.findById(order.storeId);
    if (storeResult.isOk()) {
      storeName = storeResult.value.name;
    }

    // Customer name would come from user profile — for now use a placeholder
    // This avoids coupling to UserRepository until the user module is more mature
    const customerName = 'Customer';

    return toOrderResponse(order, storeName, customerName);
  }
}
