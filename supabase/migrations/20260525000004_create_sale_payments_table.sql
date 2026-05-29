-- ===================================================================
-- Migration: create_sale_payments_table
-- Description: Payments applied to sales
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE: sale_payments
-- -------------------------------------------------------------------
create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id),
  amount_usd numeric(12,2) not null,
  payment_method text,
  payment_date timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.sale_payments enable row level security;

create policy "authenticated_all" on public.sale_payments
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger sale_payments_updated_at
  before update on public.sale_payments
  for each row execute function public.handle_updated_at();
