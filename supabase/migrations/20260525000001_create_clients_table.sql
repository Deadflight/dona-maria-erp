-- ===================================================================
-- Migration: create_clients_table
-- Description: Clients table with contact and tax info
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE: clients
-- -------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_name text,
  rut text unique,
  email text,
  phone text,
  address text,
  city text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.clients enable row level security;

create policy "authenticated_all" on public.clients
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();
