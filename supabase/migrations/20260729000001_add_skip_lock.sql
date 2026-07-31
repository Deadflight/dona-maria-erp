-- ===================================================================
-- Migration: add_skip_lock
-- Description: Add _skip_lock boolean param to record_inventory_movement
--              to eliminate redundant double-locking when called from
--              create_sale_with_movements (which already holds FOR UPDATE).
--              The sale RPC passes _skip_lock => true; purchase receipt
--              path (which calls record_inventory_movement directly) is
--              unaffected because _skip_lock defaults to false.
-- PR: A33 PR 1 — Foundation + Migration + Unit Tests
-- ===================================================================

-- -------------------------------------------------------------------
-- Step 1: Drop existing record_inventory_movement
-- -------------------------------------------------------------------
drop function if exists public.record_inventory_movement(p_producto_id uuid, p_cantidad numeric, p_tipo_movimiento text, p_referencia_tipo text, p_referencia_id text, p_motivo text);

-- -------------------------------------------------------------------
-- Step 2: Re-create record_inventory_movement with _skip_lock param
-- -------------------------------------------------------------------
create or replace function public.record_inventory_movement(
  p_producto_id      uuid,
  p_cantidad         numeric(10,2),
  p_tipo_movimiento  text,
  p_referencia_tipo  text default null,
  p_referencia_id    text default null,
  p_motivo           text default null,
  _skip_lock          boolean default false
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
  -- (skipped when caller already holds FOR UPDATE via _skip_lock)
  if not _skip_lock then
    select stock_actual into v_stock_actual
    from public.productos
    where id = p_producto_id
    for update;
  else
    select stock_actual into v_stock_actual
    from public.productos
    where id = p_producto_id;
  end if;

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
-- Step 3: Drop existing create_sale_with_movements
-- -------------------------------------------------------------------
drop function if exists public.create_sale_with_movements(p_cliente_id uuid, p_vendedor_id uuid, p_metodo_pago text, p_subtotal numeric, p_impuesto numeric, p_total numeric, p_items jsonb);

-- -------------------------------------------------------------------
-- Step 4: Re-create create_sale_with_movements with _skip_lock => true
-- -------------------------------------------------------------------
create or replace function public.create_sale_with_movements(
  p_cliente_id    uuid,
  p_vendedor_id   uuid,
  p_metodo_pago   text,
  p_subtotal      numeric,
  p_impuesto      numeric,
  p_total         numeric,
  p_items         jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_venta_id     uuid;
  v_item         jsonb;
  v_venta_num    text;
  v_stock_actual numeric(10,2);
  v_cantidad     numeric(10,2);
begin
  -- Validate items is not empty
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La lista de productos no puede estar vacía'
      using hint = 'Proporcione al menos un producto en p_items';
  end if;

  -- Validate stock sufficiency upfront (row-level lock prevents race conditions)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_cantidad := (v_item->>'cantidad')::numeric(10,2);

    select stock_actual into v_stock_actual
    from public.productos
    where id = (v_item->>'producto_id')::uuid
    for update;

    if not found then
      raise exception 'Producto no encontrado: %', v_item->>'producto_id';
    end if;

    if v_stock_actual < v_cantidad then
      raise exception 'Stock insuficiente para producto %: actual=%, requerida=%',
        v_item->>'producto_id', v_stock_actual, v_cantidad
        using hint = 'La cantidad solicitada excede el stock disponible';
    end if;
  end loop;

  -- Generate invoice number
  v_venta_num := public.generate_sale_number();

  -- 1. Insert venta header
  insert into public.ventas
    (numero_factura, cliente_id, vendedor_id, subtotal, impuesto, total, metodo_pago)
  values
    (v_venta_num, p_cliente_id, p_vendedor_id, p_subtotal, p_impuesto, p_total, p_metodo_pago)
  returning id into v_venta_id;

  -- 2. Insert detalles_venta per item
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.detalles_venta
      (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    values (
      v_venta_id,
      (v_item->>'producto_id')::uuid,
      (v_item->>'cantidad')::numeric(10,2),
      (v_item->>'precio_venta')::numeric(12,2),
      round(((v_item->>'cantidad')::numeric(10,2) * (v_item->>'precio_venta')::numeric(12,2)), 2)
    );
  end loop;

  -- 3. Insert pagos_venta (single payment per sale)
  insert into public.pagos_venta
    (venta_id, monto, metodo_pago)
  values
    (v_venta_id, p_total, p_metodo_pago);

  -- 4. Record inventory movements (deduct stock via row-locked products)
  --    Pass _skip_lock => true to avoid redundant FOR UPDATE (already held above)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    perform public.record_inventory_movement(
      p_producto_id     => (v_item->>'producto_id')::uuid,
      p_cantidad        => (v_item->>'cantidad')::numeric(10,2),
      p_tipo_movimiento => 'salida',
      p_referencia_tipo => 'sale',
      p_referencia_id   => v_venta_id::text,
      p_motivo          => 'Venta ' || v_venta_num,
      _skip_lock         => true
    );
  end loop;

  return jsonb_build_object(
    'venta_id', v_venta_id,
    'numero_factura', v_venta_num
  );
end;
$$;
