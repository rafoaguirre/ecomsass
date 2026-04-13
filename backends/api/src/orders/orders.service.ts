import { Inject, Injectable } from '@nestjs/common';
import {
  PlaceOrder,
  GetOrder,
  ListOrders,
  UpdateOrderStatus,
  type PlaceOrderInput,
  type UpdateOrderStatusInput,
} from '@ecomsaas/application/use-cases';
import type { OrderRepository, StoreRepository } from '@ecomsaas/application/ports';
import type { OrderModel, OrderStatus } from '@ecomsaas/domain';
import type { OrderResponse, OrderSummary } from '@ecomsaas/contracts';
import type { AuthUser } from '../auth/types/auth-user';
import { ORDER_REPOSITORY } from './order.tokens';
import { STORE_REPOSITORY } from '../stores/store.tokens';
import { OwnershipVerifier } from '../common/authorization/ownership-verifier';
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
    private readonly ownership: OwnershipVerifier
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
    await this.ownership.assertOrderAccess(order, user);
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
    await this.ownership.verifyStoreOwnership(storeId, user);

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
    await this.ownership.verifyStoreOwnership(order.storeId, user);

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
