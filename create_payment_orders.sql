-- Etapa 2 Mercado Pago: persistencia server-only e reconciliacao de orders.
-- Execute manualmente no SQL Editor do projeto Supabase antes de testar o PIX.

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  service_id text not null,
  amount_cents bigint not null,
  currency text not null default 'BRL',
  provider text not null default 'mercadopago',
  provider_order_id text,
  external_reference text not null,
  checkout_session_id uuid not null,
  idempotency_key uuid not null,
  payment_method text not null,
  status text not null default 'pending',
  provider_status text,
  status_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  constraint payment_orders_service_id_format check (
    service_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(service_id) between 3 and 80
  ),
  constraint payment_orders_amount_positive check (amount_cents > 0),
  constraint payment_orders_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint payment_orders_provider_check check (provider = 'mercadopago'),
  constraint payment_orders_provider_order_id_format check (
    provider_order_id is null
    or provider_order_id ~ '^ORD[A-Za-z0-9]{8,61}$'
  ),
  constraint payment_orders_external_reference_format check (
    external_reference ~ '^SUS-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ),
  constraint payment_orders_payment_method_check check (
    payment_method in ('pix', 'card')
  ),
  constraint payment_orders_status_check check (
    status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded')
  ),
  constraint payment_orders_approved_at_check check (
    approved_at is null or status in ('approved', 'refunded')
  ),
  constraint payment_orders_timestamps_check check (updated_at >= created_at),
  constraint payment_orders_provider_order_id_key unique (provider_order_id),
  constraint payment_orders_external_reference_key unique (external_reference),
  constraint payment_orders_idempotency_key_key unique (idempotency_key),
  constraint payment_orders_user_checkout_session_key unique (
    user_id,
    checkout_session_id
  )
);

alter table public.payment_orders enable row level security;

revoke all on table public.payment_orders from anon, authenticated;

grant select (
  id,
  user_id,
  service_id,
  amount_cents,
  currency,
  provider,
  provider_order_id,
  external_reference,
  payment_method,
  status,
  provider_status,
  status_detail,
  created_at,
  updated_at,
  approved_at
) on table public.payment_orders to authenticated;

grant select, insert, update on table public.payment_orders to service_role;

drop policy if exists "Users can read their own payment orders"
  on public.payment_orders;

create policy "Users can read their own payment orders"
  on public.payment_orders
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Nao existem policies de INSERT, UPDATE ou DELETE para anon/authenticated.
-- Escritas usam exclusivamente a credencial server-only do backend.
