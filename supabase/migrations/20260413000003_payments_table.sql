-- Phase 7.1: Normalized payments table
--
-- Records every payment attempt/event as a first-class row rather than
-- burying it in orders.payment JSONB. Supports:
--   - Multiple payment attempts per order (retries, different methods)
--   - Provider-neutral schema (Stripe, crypto, bank transfer, etc.)
--   - Audit trail with providerEventId linking to webhook_events
--   - Refund tracking as separate records
--
-- The orders.payment JSONB column is kept as a denormalized summary
-- for fast reads; the payments table is the source of truth.

create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  store_id            uuid not null references public.stores(id) on delete cascade,
  provider            text not null,                         -- 'stripe', 'crypto', 'cash'
  provider_payment_id text,                                  -- e.g. Stripe PaymentIntent ID
  provider_event_id   text,                                  -- links to webhook_events.provider_event_id
  method              public.payment_method not null,
  status              public.payment_status not null default 'PENDING',
  amount              bigint not null,
  currency            text not null,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Fast lookups by order and by provider payment ID
create index payments_order_id_idx on public.payments (order_id);
create index payments_store_id_idx on public.payments (store_id);
create index payments_provider_payment_id_idx
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;

-- RLS: locked to service_role (accessed via API backend only)
alter table public.payments enable row level security;
-- No policies = no access for anon/authenticated via PostgREST
