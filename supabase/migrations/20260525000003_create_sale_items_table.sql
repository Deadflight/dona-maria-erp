-- ===================================================================
-- Migration: create_sale_items_table
-- Description: Line items for each sale
-- ===================================================================

-- -------------------------------------------------------------------
-- TABLE: sale_items
-- -------------------------------------------------------------------
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id),
  product_id uuid not null references public.products(id),
  quantity numeric(12,4) not null,
  unit_price_usd numeric(12,2) not null,
  subtotal_usd numeric(12,2) not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.sale_items enable row level security;

create policy "authenticated_all" on public.sale_items
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------------------
-- Trigger: updated_at
-- -------------------------------------------------------------------
create trigger sale_items_updated_at
  before update on public.sale_items
  for each row execute function public.handle_updated_at();
