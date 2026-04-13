-- Phase 7.1: Durable webhook idempotency
--
-- Prevents duplicate processing of provider webhook events across
-- process restarts and multi-pod deployments.

create table if not exists public.webhook_events (
  id                uuid primary key default gen_random_uuid(),
  provider          text    not null,   -- e.g. 'stripe', 'crypto'
  provider_event_id text    not null,   -- e.g. Stripe event ID
  event_type        text    not null,   -- e.g. 'payment_intent.succeeded'
  processed_at      timestamptz not null default now()
);

-- Unique constraint ensures idempotency: same provider + event ID = reject
create unique index webhook_events_provider_event_idx
  on public.webhook_events (provider, provider_event_id);

-- Cleanup index for TTL-based pruning (background job can DELETE WHERE processed_at < now() - interval '30 days')
create index webhook_events_processed_at_idx
  on public.webhook_events (processed_at);

-- RLS: no direct access from authenticated users; only service_role
alter table public.webhook_events enable row level security;
-- No policies = no access for anon/authenticated via PostgREST
