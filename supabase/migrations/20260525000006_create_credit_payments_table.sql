-- ===================================================================
-- Migration: create_credit_payments_table
-- Description: Payments made against credits
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE: credit_payments
-- -------------------------------------------------------------------
create table if not exists public.credit_payments (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid not null references public.credits(id),
  amount_usd numeric(12,2) not null,
  payment_date timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.credit_payments enable row level security;

create policy "authenticated_all" on public.credit_payments
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger credit_payments_updated_at
  before update on public.credit_payments
  for each row execute function public.handle_updated_at();
