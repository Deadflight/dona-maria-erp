-- ===================================================================
-- Migration: create_credits_table
-- Description: Client credit accounts linked to sales
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE: credits
-- -------------------------------------------------------------------
create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id),
  client_id uuid not null references public.clients(id),
  total_usd numeric(12,2) not null,
  paid_usd numeric(12,2) default 0,
  due_date date not null,
  status text default 'active' check (status in ('active', 'paid', 'defaulted')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.credits enable row level security;

create policy "authenticated_all" on public.credits
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger credits_updated_at
  before update on public.credits
  for each row execute function public.handle_updated_at();
