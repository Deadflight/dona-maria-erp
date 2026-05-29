-- ===================================================================
-- Migration: create_products_table
-- Description: Products table with fractional stock support
-- ===================================================================

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------
-- Helper function: auto-update updated_at timestamp
-- -------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -------------------------------------------------------------------
-- TABLE: products
-- -------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  sku text unique not null,
  barcode text unique,
  unit_type text not null default 'unit' check (unit_type in ('unit', 'weight', 'length', 'mixed')),
  base_unit text not null default 'unit' check (base_unit in ('kg', 'g', 'm', 'cm', 'unit')),
  conversion_factor numeric(10,4) default 1,
  price_usd numeric(12,2) not null,
  cost_usd numeric(12,2),
  current_stock numeric(12,4) not null default 0,
  min_stock numeric(12,4) not null default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.products enable row level security;

create policy "authenticated_all" on public.products
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();
