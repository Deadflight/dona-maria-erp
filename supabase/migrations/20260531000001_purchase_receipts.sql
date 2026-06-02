-- ===================================================================
-- Migration: purchase_receipts
-- Description: Proveedores, purchase_receipts, receipt_items, RPC
-- ===================================================================

-- -------------------------------------------------------------------
-- Step 1: Create sequence for receipt numbering
--         Format: REC-{YYYYMMDD}-{NNNN}
-- -------------------------------------------------------------------
create sequence if not exists public.seq_receipt_number
  as integer
  minvalue 1
  maxvalue 9999
  cycle;

-- -------------------------------------------------------------------
-- Step 2: Create proveedores table
-- -------------------------------------------------------------------
create table if not exists public.proveedores (
  id          uuid        primary key default gen_random_uuid(),
  nombre      text        not null,
  ruc         text        unique,
  direccion   text,
  telefono    text,
  email       text,
  created_at  timestamptz not null default now(),
  created_by  uuid        references public.profiles(id) on delete set null
);

alter table public.proveedores enable row level security;

-- All authenticated users can view suppliers
create policy "proveedores_select_all" on public.proveedores
  for select to authenticated
  using (true);

-- Only admin role can insert suppliers
create policy "proveedores_admin_insert" on public.proveedores
  for insert to authenticated
  with check (public.get_user_role() = 'admin');

-- No update/delete policies — immutable for non-admin

-- -------------------------------------------------------------------
-- Step 3: Create purchase_receipts table
-- -------------------------------------------------------------------
create table if not exists public.purchase_receipts (
  id                uuid        primary key default gen_random_uuid(),
  numero_recepcion  text        not null,
  proveedor_id      uuid        not null references public.proveedores(id),
  observaciones     text,
  created_by        uuid        not null references public.profiles(id),
  created_at        timestamptz not null default now(),
  constraint purchase_receipts_numero_recepcion_key unique (numero_recepcion)
);

alter table public.purchase_receipts enable row level security;

-- All authenticated users can view receipts
create policy "receipts_select_all" on public.purchase_receipts
  for select to authenticated
  using (true);

-- Only admin role can insert receipts
create policy "receipts_admin_insert" on public.purchase_receipts
  for insert to authenticated
  with check (public.get_user_role() = 'admin');

-- No update/delete policies — immutable by design

-- -------------------------------------------------------------------
-- Step 4: Create receipt_items table
-- -------------------------------------------------------------------
create table if not exists public.receipt_items (
  id                uuid           primary key default gen_random_uuid(),
  recepcion_id      uuid           not null references public.purchase_receipts(id) on delete cascade,
  producto_id       uuid           not null references public.productos(id),
  cantidad_recibida numeric(10,2)  not null check (cantidad_recibida > 0),
  precio_compra     numeric(12,2)  not null,
  created_at        timestamptz    not null default now()
);

alter table public.receipt_items enable row level security;

-- All authenticated users can view receipt items
create policy "receipt_items_select_all" on public.receipt_items
  for select to authenticated
  using (true);

-- Only admin role can insert receipt items
create policy "receipt_items_admin_insert" on public.receipt_items
  for insert to authenticated
  with check (public.get_user_role() = 'admin');

-- No update/delete policies — immutable by design

-- -------------------------------------------------------------------
-- Step 5: Create indexes
-- -------------------------------------------------------------------
create index if not exists idx_receipt_proveedor
  on public.purchase_receipts (proveedor_id);

create index if not exists idx_receipt_created_by
  on public.purchase_receipts (created_by);

create index if not exists idx_receipt_numero
  on public.purchase_receipts (numero_recepcion);

create index if not exists idx_receipt_items_recepcion
  on public.receipt_items (recepcion_id);

create index if not exists idx_receipt_items_producto
  on public.receipt_items (producto_id);

-- -------------------------------------------------------------------
-- Step 6: Fix inventory_movements RLS policy
--         Old policy references public.perfiles and rol = 'admin',
--         but migration 20260530000008 renamed the table to profiles
--         and column to role. This policy was created in migration
--         20260531000000 and missed the rename.
-- -------------------------------------------------------------------
drop policy if exists "movements_insert_admin" on public.inventory_movements;

create policy "movements_insert_admin" on public.inventory_movements
  for insert to authenticated
  with check (public.get_user_role() = 'admin');

-- -------------------------------------------------------------------
-- Step 7: Helper function for receipt number generation
-- -------------------------------------------------------------------
create or replace function public.generate_receipt_number()
returns text
language sql
as $$
  select 'REC-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.seq_receipt_number')::text, 4, '0')
$$;

-- -------------------------------------------------------------------
-- Step 8: Create create_receipt_with_movements() RPC
--         SECURITY DEFINER wrapper that atomically:
--           1. INSERTs purchase_receipts header
--           2. INSERTs receipt_items per item
--           3. CALLs record_inventory_movement('entrada') per item
-- -------------------------------------------------------------------
create or replace function public.create_receipt_with_movements(
  p_numero_recepcion  text default null,
  p_proveedor_id      uuid,
  p_observaciones     text default null,
  p_items             jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receipt_id   uuid;
  v_item         jsonb;
  v_items_count  int := 0;
  v_receipt_num  text;
begin
  -- Validate items is not empty
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La lista de artículos no puede estar vacía'
      using hint = 'Proporcione al menos un artículo en p_items';
  end if;

  -- Generate receipt number if not provided
  v_receipt_num := coalesce(p_numero_recepcion, public.generate_receipt_number());

  -- 1. Insert header
  insert into public.purchase_receipts
    (numero_recepcion, proveedor_id, observaciones, created_by)
  values
    (v_receipt_num, p_proveedor_id, p_observaciones, auth.uid())
  returning id into v_receipt_id;

  -- 2. Process items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.receipt_items
      (recepcion_id, producto_id, cantidad_recibida, precio_compra)
    values (
      v_receipt_id,
      (v_item->>'producto_id')::uuid,
      (v_item->>'cantidad_recibida')::numeric(10,2),
      (v_item->>'precio_compra')::numeric(12,2)
    );

    perform public.record_inventory_movement(
      p_producto_id     => (v_item->>'producto_id')::uuid,
      p_cantidad        => (v_item->>'cantidad_recibida')::numeric(10,2),
      p_tipo_movimiento => 'entrada',
      p_referencia_tipo => 'receipt',
      p_referencia_id   => v_receipt_id::text,
      p_motivo          => 'Recepción ' || v_receipt_num
    );

    v_items_count := v_items_count + 1;
  end loop;

  return jsonb_build_object(
    'receipt_id', v_receipt_id,
    'items_processed', v_items_count
  );
end;
$$;
