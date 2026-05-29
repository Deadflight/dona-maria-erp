-- ===================================================================
-- Migration: create_exchange_rates_table
-- Description: Currency exchange rate history
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE: exchange_rates
-- -------------------------------------------------------------------
create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  from_currency text not null,
  to_currency text not null,
  rate numeric(12,6) not null,
  effective_date date not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (from_currency, to_currency, effective_date)
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.exchange_rates enable row level security;

create policy "authenticated_all" on public.exchange_rates
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger exchange_rates_updated_at
  before update on public.exchange_rates
  for each row execute function public.handle_updated_at();
