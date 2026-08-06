-- ===================================================================
-- Migration: fix_sale_detail_discounts
-- Description: Persist line-level discounts and net subtotals for sales.
-- ===================================================================

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
  v_venta_id         uuid;
  v_item             jsonb;
  v_venta_num        text;
  v_stock_actual     numeric(10,2);
  v_cantidad         numeric(10,2);
  v_precio_venta     numeric(12,2);
  v_descuento_bruto  numeric;
  v_descuento_monto  numeric;
  v_subtotal_bruto   numeric;
  v_subtotal_neto    numeric;
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
    v_cantidad := (v_item->>'cantidad')::numeric(10,2);
    v_precio_venta := (v_item->>'precio_venta')::numeric(12,2);
    v_descuento_bruto := greatest(coalesce((v_item->>'descuento')::numeric, 0), 0);
    v_subtotal_bruto := v_cantidad * v_precio_venta;

    if coalesce(v_item->>'descuento_tipo', '%') = 'fixed' then
      v_descuento_monto := least(v_descuento_bruto, v_subtotal_bruto);
    else
      v_descuento_monto := v_subtotal_bruto * least(v_descuento_bruto, 100) / 100;
    end if;

    v_subtotal_neto := round(v_subtotal_bruto - v_descuento_monto, 2);
    v_descuento_monto := round(v_descuento_monto, 2);

    insert into public.detalles_venta
      (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
    values (
      v_venta_id,
      (v_item->>'producto_id')::uuid,
      v_cantidad,
      v_precio_venta,
      v_descuento_monto,
      v_subtotal_neto
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
