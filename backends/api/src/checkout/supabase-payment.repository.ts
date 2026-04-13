import { Inject, Injectable } from '@nestjs/common';
import type { PaymentRepository } from '@ecomsaas/application/ports';
import { err, ok, type Result } from '@ecomsaas/domain';
import type { Payment, PaymentStatus, CurrencyCode, PaymentMethod } from '@ecomsaas/domain';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import { SUPABASE_CLIENT } from '../database';

type PaymentRow = {
  id: string;
  order_id: string;
  store_id: string;
  provider: string;
  provider_payment_id: string | null;
  provider_event_id: string | null;
  method: string;
  status: string;
  amount: string; // bigint comes as string from Supabase
  currency: string;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class SupabasePaymentRepository implements PaymentRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async record(payment: Payment): Promise<Result<Payment, Error>> {
    const { error } = await this.supabase.from('payments').insert({
      id: payment.id,
      order_id: payment.orderId,
      store_id: payment.storeId,
      provider: payment.provider,
      provider_payment_id: payment.providerPaymentId ?? null,
      provider_event_id: payment.providerEventId ?? null,
      method: payment.method,
      status: payment.status,
      amount: payment.amount.amount.toString(),
      currency: payment.amount.currency,
      metadata: payment.metadata,
    });

    if (error) {
      return err(new Error(`Failed to record payment: ${error.message}`));
    }

    return ok(payment);
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .returns<PaymentRow[]>();

    if (error) {
      throw new Error(`Failed to query payments: ${error.message}`);
    }

    return (data ?? []).map((row) => this.toPayment(row));
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Result<void, Error>> {
    const { error } = await this.supabase
      .from('payments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return err(new Error(`Failed to update payment status: ${error.message}`));
    }

    return ok(undefined);
  }

  private toPayment(row: PaymentRow): Payment {
    return {
      id: row.id,
      orderId: row.order_id,
      storeId: row.store_id,
      provider: row.provider,
      providerPaymentId: row.provider_payment_id ?? undefined,
      providerEventId: row.provider_event_id ?? undefined,
      method: row.method as PaymentMethod,
      status: row.status as PaymentStatus,
      amount: {
        amount: BigInt(row.amount),
        currency: row.currency as CurrencyCode,
      },
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
