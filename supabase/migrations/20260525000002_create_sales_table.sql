-- ===================================================================
-- Migration: create_sales_table
-- Description: Sales/orders table
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE: sales
-- -------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id),
  total_usd numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.sales enable row level security;

create policy "authenticated_all" on public.sales
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger sales_updated_at
  before update on public.sales
  for each row execute function public.handle_updated_at();
