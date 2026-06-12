-- Authenticated ecommerce records for the static storefront.
-- Neon Auth owns identity; the Neon Data API supplies auth.user_id() to RLS.

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  label text not null default 'Shipping',
  full_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references neon_auth."user"(id) on delete restrict,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'payment_review', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sent', 'failed')),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping_total numeric(12, 2) not null check (shipping_total >= 0),
  order_total numeric(12, 2) not null check (order_total >= 0),
  loyalty_credit numeric(12, 2) not null default 0 check (loyalty_credit >= 0),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  notes text,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  brand text,
  pack_count integer not null check (pack_count > 0),
  pack_label text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) generated always as (unit_price * quantity) stored,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists customer_addresses_user_id_idx
  on public.customer_addresses(user_id);
create index if not exists orders_user_id_created_at_idx
  on public.orders(user_id, created_at desc);
create index if not exists order_items_order_id_idx
  on public.order_items(order_id);
create index if not exists order_events_order_id_created_at_idx
  on public.order_events(order_id, created_at desc);

alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

drop policy if exists customer_addresses_owner_all on public.customer_addresses;
create policy customer_addresses_owner_all
  on public.customer_addresses
  for all
  to authenticated
  using (user_id::text = auth.user_id())
  with check (user_id::text = auth.user_id());

drop policy if exists orders_owner_select on public.orders;
create policy orders_owner_select
  on public.orders
  for select
  to authenticated
  using (user_id::text = auth.user_id());

drop policy if exists order_items_owner_select on public.order_items;
create policy order_items_owner_select
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id::text = auth.user_id()
    )
  );

drop policy if exists order_events_owner_select on public.order_events;
create policy order_events_owner_select
  on public.order_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_events.order_id
        and orders.user_id::text = auth.user_id()
    )
  );

create or replace function public.create_checkout_order(
  p_reference text,
  p_currency text,
  p_customer jsonb,
  p_shipping_address jsonb,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_order_id uuid;
  v_subtotal numeric(12, 2);
  v_shipping numeric(12, 2) := 35.00;
begin
  if auth.user_id() is null then
    raise exception 'Authentication required';
  end if;

  v_user_id := auth.user_id()::uuid;

  if p_reference !~ '^NG-[0-9]{8}-[A-Z0-9]{6}$' then
    raise exception 'Invalid order reference';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order requires at least one item';
  end if;

  select coalesce(sum(
    round((item->>'unit_price')::numeric, 2) * (item->>'quantity')::integer
  ), 0)
  into v_subtotal
  from jsonb_array_elements(p_items) item;

  insert into public.orders (
    reference,
    user_id,
    currency,
    subtotal,
    shipping_total,
    order_total,
    loyalty_credit,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    notes
  )
  values (
    p_reference,
    v_user_id,
    upper(p_currency),
    v_subtotal,
    v_shipping,
    v_subtotal + v_shipping,
    floor(v_subtotal * 0.20),
    trim(p_customer->>'name'),
    lower(trim(p_customer->>'email')),
    trim(p_customer->>'phone'),
    p_shipping_address,
    nullif(trim(p_notes), '')
  )
  on conflict (reference) do update
    set updated_at = now()
    where orders.user_id = v_user_id
  returning id into v_order_id;

  if v_order_id is null then
    raise exception 'Order reference belongs to another customer';
  end if;

  if not exists (select 1 from public.order_items where order_id = v_order_id) then
    insert into public.order_items (
      order_id,
      product_slug,
      product_name,
      brand,
      pack_count,
      pack_label,
      unit_price,
      quantity,
      image_url
    )
    select
      v_order_id,
      trim(item->>'product_slug'),
      trim(item->>'product_name'),
      nullif(trim(item->>'brand'), ''),
      (item->>'pack_count')::integer,
      nullif(trim(item->>'pack_label'), ''),
      round((item->>'unit_price')::numeric, 2),
      (item->>'quantity')::integer,
      nullif(trim(item->>'image_url'), '')
    from jsonb_array_elements(p_items) item;

    insert into public.order_events (order_id, event_type)
    values (v_order_id, 'order_created');
  end if;

  return v_order_id;
end;
$$;

create or replace function public.set_order_email_status(
  p_order_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('sent', 'failed') then
    raise exception 'Invalid email status';
  end if;

  update public.orders
  set email_status = p_status,
      email_sent_at = case when p_status = 'sent' then now() else email_sent_at end,
      updated_at = now()
  where id = p_order_id
    and user_id::text = auth.user_id();

  if not found then
    raise exception 'Order not found';
  end if;

  insert into public.order_events (order_id, event_type, details)
  values (p_order_id, 'email_' || p_status, jsonb_build_object('status', p_status));
end;
$$;

revoke all on function public.create_checkout_order(text, text, jsonb, jsonb, text, jsonb) from public;
revoke all on function public.set_order_email_status(uuid, text) from public;
grant execute on function public.create_checkout_order(text, text, jsonb, jsonb, text, jsonb) to authenticated;
grant execute on function public.set_order_email_status(uuid, text) to authenticated;

grant select, insert, update, delete on public.customer_addresses to authenticated;
grant select on public.orders, public.order_items, public.order_events to authenticated;
