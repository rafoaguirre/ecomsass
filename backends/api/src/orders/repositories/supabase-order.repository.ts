import { Inject, Injectable } from '@nestjs/common';
import type { OrderRepository } from '@ecomsaas/application/ports';
import { NotFoundError, OrderModel, err, ok, type Result } from '@ecomsaas/domain';
import type {
  OrderStatus,
  CurrencyCode,
  PaymentMethod,
  PaymentStatus,
  FulfillmentType,
} from '@ecomsaas/domain';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import type { Order, OrderItem, PaymentInfo, FulfillmentInfo, OrderNote } from '@ecomsaas/domain';
import type { Money } from '@ecomsaas/domain';
import { SUPABASE_CLIENT } from '../../database';
import { applyPagination, asRecord } from '../../common/database';

// ---------------------------------------------------------------------------
// Row types (match the DB schema)
// ---------------------------------------------------------------------------

interface OrderRow {
  id: string;
  store_id: string;
  user_id: string;
  reference_id: string;
  status: string;
  subtotal_amount: string; // bigint comes as string from pg
  subtotal_currency: string;
  tax_amount: string | null;
  tax_currency: string | null;
  discount_amount: string | null;
  discount_currency: string | null;
  delivery_fee_amount: string | null;
  delivery_fee_currency: string | null;
  total_amount: string;
  total_currency: string;
  payment: unknown;
  fulfillment: unknown;
  notes: unknown;
  metadata: unknown;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price_amount: string;
  unit_price_currency: string;
  subtotal_amount: string;
  subtotal_currency: string;
  discount_amount: string | null;
  discount_currency: string | null;
  total_amount: string;
  total_currency: string;
  metadata: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMoney(amount: string, currency: string): Money {
  return { amount: BigInt(amount), currency: currency as CurrencyCode };
}

function toOptionalMoney(amount: string | null, currency: string | null): Money | undefined {
  if (amount === null || currency === null) return undefined;
  return toMoney(amount, currency);
}

function asPaymentInfo(raw: unknown): PaymentInfo {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    method: (obj.method as PaymentMethod) ?? 'CASH',
    status: (obj.status as PaymentStatus) ?? 'PENDING',
    amount: {
      amount: BigInt(String(obj.amount_value ?? obj.amount ?? '0')),
      currency: (obj.amount_currency ?? obj.currency ?? 'CAD') as CurrencyCode,
    },
    transactionId: obj.transactionId as string | undefined,
    stripePaymentIntentId: obj.stripePaymentIntentId as string | undefined,
    metadata: obj.metadata as Record<string, unknown> | undefined,
  };
}

function asFulfillmentInfo(raw: unknown): FulfillmentInfo {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    type: (obj.type as FulfillmentType) ?? 'DELIVERY',
    address: obj.address as FulfillmentInfo['address'],
    scheduledFor: obj.scheduledFor ? new Date(obj.scheduledFor as string) : undefined,
    trackingNumber: obj.trackingNumber as string | undefined,
    carrier: obj.carrier as string | undefined,
    notes: obj.notes as string | undefined,
  };
}

function asOrderNotes(raw: unknown): OrderNote[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((n: Record<string, unknown>) => ({
    id: n.id as string,
    targetId: n.targetId as string,
    target: n.target as 'store' | 'buyer' | 'notification',
    note: n.note as string,
    createdAt: new Date(n.createdAt as string),
  }));
}

function serializePaymentInfo(payment: PaymentInfo): Record<string, unknown> {
  return {
    method: payment.method,
    status: payment.status,
    amount_value: payment.amount.amount.toString(),
    amount_currency: payment.amount.currency,
    transactionId: payment.transactionId,
    stripePaymentIntentId: payment.stripePaymentIntentId,
    metadata: payment.metadata,
  };
}

function serializeFulfillmentInfo(fulfillment: FulfillmentInfo): Record<string, unknown> {
  return {
    type: fulfillment.type,
    address: fulfillment.address,
    scheduledFor: fulfillment.scheduledFor?.toISOString(),
    trackingNumber: fulfillment.trackingNumber,
    carrier: fulfillment.carrier,
    notes: fulfillment.notes,
  };
}

function serializeOrderNotes(notes: OrderNote[]): unknown[] {
  return notes.map((n) => ({
    id: n.id,
    targetId: n.targetId,
    target: n.target,
    note: n.note,
    createdAt: n.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

@Injectable()
export class SupabaseOrderRepository implements OrderRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Result<OrderModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .limit(1)
      .maybeSingle<OrderRow>();

    if (error) {
      throw new Error(`Failed to query order by id: ${error.message}`);
    }

    if (!data) {
      return err(new NotFoundError('Order', id));
    }

    return ok(this.toOrderModel(data));
  }

  async findByReferenceId(referenceId: string): Promise<Result<OrderModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('reference_id', referenceId)
      .limit(1)
      .maybeSingle<OrderRow>();

    if (error) {
      throw new Error(`Failed to query order by reference id: ${error.message}`);
    }

    if (!data) {
      return err(new NotFoundError('Order', referenceId));
    }

    return ok(this.toOrderModel(data));
  }

  async findByStoreId(
    storeId: string,
    options?: { offset?: number; limit?: number; status?: OrderStatus }
  ): Promise<OrderModel[]> {
    let query = this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    ({ query } = applyPagination(query, {
      offset: options?.offset,
      limit: options?.limit,
    }));

    const { data, error } = await query.returns<OrderRow[]>();

    if (error) {
      throw new Error(`Failed to query orders by store id: ${error.message}`);
    }

    return (data ?? []).map((row) => this.toOrderModel(row));
  }

  async findByUserId(
    userId: string,
    options?: { offset?: number; limit?: number; status?: OrderStatus }
  ): Promise<OrderModel[]> {
    let query = this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    ({ query } = applyPagination(query, {
      offset: options?.offset,
      limit: options?.limit,
    }));

    const { data, error } = await query.returns<OrderRow[]>();

    if (error) {
      throw new Error(`Failed to query orders by user id: ${error.message}`);
    }

    return (data ?? []).map((row) => this.toOrderModel(row));
  }

  async save(order: OrderModel): Promise<Result<OrderModel, Error>> {
    // Build JSON payloads for the atomic RPC function
    const orderPayload = {
      id: order.id,
      store_id: order.storeId,
      user_id: order.userId,
      reference_id: order.referenceId,
      status: order.status,
      subtotal_amount: order.subtotal.amount.toString(),
      subtotal_currency: order.subtotal.currency,
      tax_amount: order.tax?.amount.toString() ?? null,
      tax_currency: order.tax?.currency ?? null,
      discount_amount: order.discount?.amount.toString() ?? null,
      discount_currency: order.discount?.currency ?? null,
      delivery_fee_amount: order.deliveryFee?.amount.toString() ?? null,
      delivery_fee_currency: order.deliveryFee?.currency ?? null,
      total_amount: order.total.amount.toString(),
      total_currency: order.total.currency,
      payment: serializePaymentInfo(order.payment),
      fulfillment: serializeFulfillmentInfo(order.fulfillment),
      notes: serializeOrderNotes(order.notes),
      metadata: order.metadata,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    };

    const itemPayloads = order.items.map((item) => ({
      id: item.id,
      product_id: item.productId,
      product_name: item.productName,
      variant_id: item.variantId ?? null,
      variant_name: item.variantName ?? null,
      quantity: item.quantity,
      unit_price_amount: item.unitPrice.amount.toString(),
      unit_price_currency: item.unitPrice.currency,
      subtotal_amount: item.subtotal.amount.toString(),
      subtotal_currency: item.subtotal.currency,
      discount_amount: item.discount?.amount.toString() ?? null,
      discount_currency: item.discount?.currency ?? null,
      total_amount: item.total.amount.toString(),
      total_currency: item.total.currency,
      metadata: item.metadata ?? {},
    }));

    // Atomic upsert: order + items in a single transaction via RPC
    const { error } = await this.supabase.rpc('save_order_atomic', {
      p_order: orderPayload,
      p_items: itemPayloads,
    });

    if (error) {
      return err(new Error(`Failed to save order: ${error.message}`));
    }

    // Re-fetch the full order to return consistent data
    return this.findById(order.id) as Promise<Result<OrderModel, Error>>;
  }

  async delete(id: string): Promise<Result<void, Error>> {
    const { error } = await this.supabase.from('orders').delete().eq('id', id);

    if (error) {
      return err(new Error(`Failed to delete order: ${error.message}`));
    }

    return ok(undefined);
  }

  async generateReferenceId(storeId: string): Promise<string> {
    const { data, error } = await this.supabase.rpc('next_order_reference', {
      p_store_id: storeId,
    });

    if (error) {
      throw new Error(`Failed to generate reference ID: ${error.message}`);
    }

    return data as string;
  }

  // ---------------------------------------------------------------------------
  // Row → Domain model mapping
  // ---------------------------------------------------------------------------

  private toOrderModel(row: OrderRow): OrderModel {
    const items: OrderItem[] = (row.order_items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      variantId: item.variant_id ?? undefined,
      variantName: item.variant_name ?? undefined,
      quantity: item.quantity,
      unitPrice: toMoney(item.unit_price_amount, item.unit_price_currency),
      subtotal: toMoney(item.subtotal_amount, item.subtotal_currency),
      discount: toOptionalMoney(item.discount_amount, item.discount_currency),
      total: toMoney(item.total_amount, item.total_currency),
      metadata: asRecord(item.metadata),
    }));

    const order: Order = {
      id: row.id,
      storeId: row.store_id,
      userId: row.user_id,
      referenceId: row.reference_id,
      status: row.status as OrderStatus,
      items,
      subtotal: toMoney(row.subtotal_amount, row.subtotal_currency),
      tax: toOptionalMoney(row.tax_amount, row.tax_currency),
      discount: toOptionalMoney(row.discount_amount, row.discount_currency),
      deliveryFee: toOptionalMoney(row.delivery_fee_amount, row.delivery_fee_currency),
      total: toMoney(row.total_amount, row.total_currency),
      payment: asPaymentInfo(row.payment),
      fulfillment: asFulfillmentInfo(row.fulfillment),
      notes: asOrderNotes(row.notes),
      metadata: asRecord(row.metadata),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return OrderModel.fromData(order);
  }
}
