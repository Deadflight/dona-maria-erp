-- ===================================================================
-- Migration: inventory_movements
-- Description: Immutable audit trail for stock changes
-- ===================================================================

-- -------------------------------------------------------------------
-- Step 1: Modify productos — drop stock_actual CHECK, change to numeric
-- -------------------------------------------------------------------
alter table public.productos
  drop constraint if exists productos_stock_actual_check;

alter table public.productos
  alter column stock_actual type numeric(10,2)
  using stock_actual::numeric(10,2);

-- -------------------------------------------------------------------
-- Step 2: Create inventory_movements table
-- -------------------------------------------------------------------
create table if not exists public.inventory_movements (
  id              uuid        primary key default gen_random_uuid(),
  producto_id     uuid        not null references public.productos(id),
  cantidad        numeric(10,2) not null check (cantidad > 0),
  tipo_movimiento text        not null check (tipo_movimiento in ('entrada', 'salida', 'ajuste')),
  stock_resultante numeric(10,2) not null,
  referencia_tipo text,
  referencia_id   text,
  motivo          text,
  created_by      uuid        references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- -------------------------------------------------------------------
-- Step 3: Enable Row Level Security
-- -------------------------------------------------------------------
alter table public.inventory_movements enable row level security;

-- All authenticated users can read movements
create policy "movements_select_all" on public.inventory_movements
  for select to authenticated
  using (true);

-- Only admin role can insert movements
create policy "movements_insert_admin" on public.inventory_movements
  for insert to authenticated
  with check (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- No update or delete policies — immutable audit log

-- -------------------------------------------------------------------
-- Step 4: Create stock_from_movements VIEW
-- -------------------------------------------------------------------
create view public.stock_from_movements as
select
  producto_id,
  sum(
    case
      when tipo_movimiento = 'salida' then -cantidad
      else cantidad
    end
  ) as stock_actual
from public.inventory_movements
group by producto_id;

-- -------------------------------------------------------------------
-- Step 5: Create record_inventory_movement RPC
-- -------------------------------------------------------------------
create or replace function public.record_inventory_movement(
  p_producto_id      uuid,
  p_cantidad         numeric(10,2),
  p_tipo_movimiento  text,
  p_referencia_tipo  text default null,
  p_referencia_id    text default null,
  p_motivo           text default null
) returns uuid
language plpgsql
security definer
as $$
declare
  v_stock_actual     numeric(10,2);
  v_stock_resultante numeric(10,2);
  v_movement_id      uuid;
begin
  -- Lock the product row to prevent race conditions
  select stock_actual into v_stock_actual
  from public.productos
  where id = p_producto_id
  for update;

  if not found then
    raise exception 'Producto no encontrado'
      using hint = 'El producto especificado no existe';
  end if;

  -- Validate sufficient stock for salidas
  if p_tipo_movimiento = 'salida' and v_stock_actual < p_cantidad then
    raise exception 'Stock insuficiente: actual=%, requerida=%', v_stock_actual, p_cantidad
      using hint = 'La cantidad de salida excede el stock actual';
  end if;

  -- Calculate resulting stock
  if p_tipo_movimiento = 'salida' then
    v_stock_resultante := v_stock_actual - p_cantidad;
  else
    -- entrada or ajuste
    v_stock_resultante := v_stock_actual + p_cantidad;
  end if;

  -- Insert movement audit row
  insert into public.inventory_movements (
    producto_id, cantidad, tipo_movimiento, stock_resultante,
    referencia_tipo, referencia_id, motivo, created_by
  ) values (
    p_producto_id, p_cantidad, p_tipo_movimiento, v_stock_resultante,
    p_referencia_tipo, p_referencia_id, p_motivo, auth.uid()
  ) returning id into v_movement_id;

  -- Update product stock atomically
  update public.productos
  set stock_actual = v_stock_resultante,
      updated_at = now()
  where id = p_producto_id;

  return v_movement_id;
end;
$$;

-- -------------------------------------------------------------------
-- Step 6: Create indexes
-- -------------------------------------------------------------------
create index if not exists idx_movements_product_created
  on public.inventory_movements (producto_id, created_at desc);

create index if not exists idx_movements_reference
  on public.inventory_movements (referencia_tipo, referencia_id);

create index if not exists idx_movements_created_by
  on public.inventory_movements (created_by);

-- -------------------------------------------------------------------
-- Step 7: Backfill existing stock as ajuste movements
-- -------------------------------------------------------------------
insert into public.inventory_movements (
  producto_id, cantidad, tipo_movimiento, stock_resultante, created_by
)
select
  id,
  stock_actual,
  'ajuste',
  stock_actual,
  null
from public.productos
where stock_actual > 0;
