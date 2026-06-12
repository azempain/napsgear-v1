-- Educational storefront clone: application authorization data only.
-- Neon Auth remains the sole owner of credentials, sessions, and identities.

create table if not exists public.app_roles (
  code text primary key,
  name text not null,
  description text not null,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id uuid primary key references neon_auth."user"(id) on delete cascade,
  role_code text not null references public.app_roles(code),
  display_name text,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'invited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sample_user_personas (
  id uuid primary key,
  name text not null,
  email text not null unique,
  role_code text not null references public.app_roles(code),
  access_notes text not null,
  is_login_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  check (is_login_enabled = false)
);

insert into public.app_roles (code, name, description, permissions)
values
  ('customer', 'Customer', 'Can manage their profile, cart, and orders.',
   '["profile:read","profile:update","order:create","order:read:self"]'::jsonb),
  ('support', 'Support', 'Can assist customers and review order support details.',
   '["profile:read:self","order:read","support:manage"]'::jsonb),
  ('manager', 'Manager', 'Can manage catalog content, orders, and support workflows.',
   '["catalog:manage","order:read","order:update","support:manage"]'::jsonb),
  ('admin', 'Administrator', 'Full application administration access.',
   '["*"]'::jsonb)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    permissions = excluded.permissions,
    updated_at = now();

-- Non-login personas exercise role-based interfaces without credentials.
insert into public.sample_user_personas (id, name, email, role_code, access_notes)
values
  ('10000000-0000-4000-8000-000000000001', 'Sample Customer',
   'customer@example.invalid', 'customer', 'Self-service profile and order access.'),
  ('10000000-0000-4000-8000-000000000002', 'Sample Support',
   'support@example.invalid', 'support', 'Customer support and order review access.'),
  ('10000000-0000-4000-8000-000000000003', 'Sample Manager',
   'manager@example.invalid', 'manager', 'Catalog, order, and support workflow access.'),
  ('10000000-0000-4000-8000-000000000004', 'Sample Administrator',
   'admin@example.invalid', 'admin', 'Full application administration access.')
on conflict (id) do update
set name = excluded.name,
    email = excluded.email,
    role_code = excluded.role_code,
    access_notes = excluded.access_notes;

create index if not exists user_profiles_role_code_idx
  on public.user_profiles(role_code);

create index if not exists sample_user_personas_role_code_idx
  on public.sample_user_personas(role_code);
