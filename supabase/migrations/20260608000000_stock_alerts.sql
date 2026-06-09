-- ===================================================================
-- Migration: stock_alerts
-- Description: RPCs for stock alerts and bulk price updates
-- ===================================================================

-- -------------------------------------------------------------------
-- Step 1: Fix stock_minimo type to match numeric(10,2) of stock_actual
-- -------------------------------------------------------------------
alter table public.productos
  alter column stock_minimo type numeric(10,2)
  using stock_minimo::numeric(10,2);

-- -------------------------------------------------------------------
-- Step 2: Composite index for stock alert queries
-- -------------------------------------------------------------------
create index if not exists idx_productos_stock_alert
  on public.productos (activo, stock_actual, stock_minimo);

-- -------------------------------------------------------------------
-- Step 3: RPC — get_stock_alerts
-- Returns paginated products where stock_actual <= stock_minimo
-- -------------------------------------------------------------------
create or replace function public.get_stock_alerts(
  p_search    text    default null,
  p_categoria text    default null,
  p_page      integer default 1,
  p_page_size integer default 10,
  p_activo    boolean default true
) returns json
language plpgsql
security definer
as $$
declare
  v_offset integer;
  v_limit  integer;
  v_rows   json;
  v_total  integer;
begin
  v_offset := (p_page - 1) * p_page_size;
  v_limit  := p_page_size;

  -- Count total matching rows
  select count(*)
  into v_total
  from public.productos p
  where p.stock_actual <= p.stock_minimo
    and (p_activo is false or p.activo = p_activo)
    and (p_search is null or p.nombre ilike '%' || p_search || '%' or p.sku ilike '%' || p_search || '%')
    and (p_categoria is null or p.categoria = p_categoria);

  -- Fetch paginated rows
  select coalesce(json_agg(r), '[]'::json)
  into v_rows
  from (
    select
      p.id,
      p.sku,
      p.nombre,
      p.categoria,
      p.stock_actual,
      p.stock_minimo,
      p.precio_venta,
      p.precio_compra,
      p.unidad_medida,
      p.activo,
      p.updated_at
    from public.productos p
    where p.stock_actual <= p.stock_minimo
      and (p_activo is false or p.activo = p_activo)
      and (p_search is null or p.nombre ilike '%' || p_search || '%' or p.sku ilike '%' || p_search || '%')
      and (p_categoria is null or p.categoria = p_categoria)
    order by p.nombre
    limit v_limit
    offset v_offset
  ) r;

  return json_build_object(
    'rows', v_rows,
    'total', v_total
  );
end;
$$;

-- -------------------------------------------------------------------
-- Step 4: RPC — bulk_update_prices
-- Atomically updates precio_venta for multiple products by percentage
-- -------------------------------------------------------------------
create or replace function public.bulk_update_prices(
  p_ids         uuid[],
  p_porcentaje  numeric
) returns json
language plpgsql
security definer
as $$
declare
  v_affected integer;
begin
  -- Validate percentage range
  if p_porcentaje < -99 or p_porcentaje > 1000 then
    raise exception 'Porcentaje fuera de rango: debe estar entre -99 y 1000'
      using hint = 'El porcentaje recibido fue %', p_porcentaje;
  end if;

  -- Atomic bulk update
  update public.productos
  set precio_venta = greatest(
        round(precio_venta * (1 + p_porcentaje / 100), 2),
        0.01
      ),
      updated_at = now()
  where id = any(p_ids)
    and activo = true;

  get diagnostics v_affected = row_count;

  return json_build_object(
    'affected', v_affected
  );
end;
$$;

-- -------------------------------------------------------------------
-- Step 5: RPC — get_stock_alert_count
-- Lightweight COUNT for navigation badge
-- -------------------------------------------------------------------
create or replace function public.get_stock_alert_count()
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.productos
  where stock_actual <= stock_minimo
    and activo = true;

  return v_count;
end;
$$;
