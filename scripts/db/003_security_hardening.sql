-- Security hardening for the ecommerce tables (idempotent).
--
-- 002_ecommerce_orders.sql already does the heavy lifting: RLS is ENABLEd,
-- owner-scoped policies use auth.user_id(), and table/function grants go to
-- `authenticated` only. This migration adds defense-in-depth on top:
--
--   1. FORCE ROW LEVEL SECURITY  — ENABLE alone lets the *table owner* bypass
--      RLS. The Data API connects as `authenticated`, not the owner, so ENABLE
--      is sufficient for the live path; FORCE closes the gap if anything ever
--      connects as the owner role through the same API.
--   2. Explicit REVOKE from anon + public — 002 never granted to anon, but a
--      stray default grant (or a future `grant ... to public`) would silently
--      open the data. Make "anon sees nothing" an asserted, not assumed, state.
--
-- Safe to run repeatedly. Run AFTER 001 and 002.

-- 1. Force RLS so the owner role cannot bypass policies via the Data API.
alter table public.customer_addresses force row level security;
alter table public.orders            force row level security;
alter table public.order_items       force row level security;
alter table public.order_events      force row level security;

-- 2. Make unauthenticated (anon) and public access impossible by construction.
--    `authenticated` keeps the grants handed out in 002.
revoke all on public.customer_addresses from anon, public;
revoke all on public.orders            from anon, public;
revoke all on public.order_items       from anon, public;
revoke all on public.order_events      from anon, public;

revoke all on function public.create_checkout_order(text, text, jsonb, jsonb, text, jsonb) from anon, public;
revoke all on function public.set_order_email_status(uuid, text) from anon, public;

-- 3. OPTIONAL belt-and-suspenders: stop anon from entering the schema at all.
--    The table REVOKEs above already guarantee anon reads/writes nothing. This
--    line is stricter but can change how the Data API surfaces errors to
--    unauthenticated callers, so it is left commented. Enable only after
--    confirming the auth + Data API flow still works for logged-in users.
-- revoke usage on schema public from anon;
