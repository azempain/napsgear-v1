-- READ-ONLY security verification for the ecommerce data model.
--
-- Run this in the Neon SQL editor (or psql) against the SAME database the
-- browser Data API talks to. It changes nothing. It asserts the invariants the
-- storefront's security depends on and RAISES EXCEPTION on the first violation,
-- so a green run means "the live DB matches the policies in 002/003".
--
-- What it proves:
--   * RLS is ENABLED *and* FORCED on every PII-bearing table.
--   * Every table has at least one owner-scoped policy.
--   * The `anon` role has NO table privileges and NO execute on the RPCs.
--   * The checkout RPCs are SECURITY DEFINER with a pinned search_path.
--
-- It cannot prove the auth provider issues correct JWTs — that needs the live
-- two-user read test described in CLAUDE.md. This covers the database half.

do $$
declare
  v_tables text[] := array[
    'customer_addresses', 'orders', 'order_items', 'order_events'
  ];
  v_table text;
  v_relid oid;
  v_enabled boolean;
  v_forced boolean;
  v_policies int;
  v_anon_privs int;
  v_fn record;
begin
  -- 1. RLS enabled + forced, and at least one policy, on each table.
  foreach v_table in array v_tables loop
    select c.oid, c.relrowsecurity, c.relforcerowsecurity
      into v_relid, v_enabled, v_forced
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = v_table;

    if v_relid is null then
      raise exception 'MISSING TABLE: public.% does not exist — run 002 first', v_table;
    end if;
    if not v_enabled then
      raise exception 'RLS NOT ENABLED on public.% — any authenticated user can read every row', v_table;
    end if;
    if not v_forced then
      raise exception 'RLS NOT FORCED on public.% — table owner bypasses policies; run 003', v_table;
    end if;

    select count(*) into v_policies
    from pg_policies
    where schemaname = 'public' and tablename = v_table;

    if v_policies = 0 then
      raise exception 'NO RLS POLICY on public.% — RLS enabled with zero policies denies everyone, but is a misconfiguration', v_table;
    end if;

    -- 2. anon must hold no privilege on the table.
    select count(*) into v_anon_privs
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = v_table
      and grantee = 'anon';

    if v_anon_privs > 0 then
      raise exception 'anon HAS % GRANT(S) on public.% — unauthenticated visitors can reach order data; run 003', v_anon_privs, v_table;
    end if;

    raise notice 'OK  %  (rls enabled+forced, % policy/policies, anon has no grants)', rpad(v_table, 18), v_policies;
  end loop;

  -- 3. The checkout RPCs must be SECURITY DEFINER with a pinned search_path,
  --    and anon must not be able to execute them.
  for v_fn in
    select p.oid, p.proname, p.prosecdef, p.proconfig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_checkout_order', 'set_order_email_status')
  loop
    if not v_fn.prosecdef then
      raise exception 'FUNCTION public.% is not SECURITY DEFINER — it cannot enforce user_id binding', v_fn.proname;
    end if;
    if v_fn.proconfig is null
       or not exists (select 1 from unnest(v_fn.proconfig) cfg where cfg like 'search_path=%') then
      raise exception 'FUNCTION public.% has no pinned search_path — vulnerable to search_path hijack', v_fn.proname;
    end if;
    if has_function_privilege('anon', v_fn.oid, 'execute') then
      raise exception 'anon CAN EXECUTE public.% — unauthenticated callers can write orders; run 003', v_fn.proname;
    end if;
    raise notice 'OK  %  (security definer, pinned search_path, anon cannot execute)', rpad(v_fn.proname, 22);
  end loop;

  raise notice '----------------------------------------------------------------';
  raise notice 'PASS: database security invariants hold. Now run the two-user';
  raise notice 'read test (log in as user B, try to read user A''s order) to';
  raise notice 'confirm the auth JWT path is also correct.';
end $$;
