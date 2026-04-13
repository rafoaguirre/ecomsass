import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import type { WebhookEventLog } from '@ecomsaas/application/ports';
import { SUPABASE_CLIENT } from '../database';

@Injectable()
export class SupabaseWebhookEventLog implements WebhookEventLog {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async isDuplicate(provider: string, eventId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('webhook_events')
      .select('id')
      .eq('provider', provider)
      .eq('provider_event_id', eventId)
      .maybeSingle();

    return data !== null;
  }

  async record(provider: string, eventId: string, eventType: string): Promise<void> {
    const { error } = await this.supabase
      .from('webhook_events')
      .insert({ provider, provider_event_id: eventId, event_type: eventType });

    // 23505 = unique_violation — already recorded (race between isDuplicate and record)
    if (error && error.code !== '23505') {
      throw new Error(`Failed to record webhook event: ${error.message}`);
    }
  }
}
