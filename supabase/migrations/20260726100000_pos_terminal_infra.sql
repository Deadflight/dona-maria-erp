-- ===================================================================
-- Migration: pos_terminal_infra
-- Description: POS Terminal infrastructure — RPC for atomic sale
--              creation, invoice number sequence, and CHECK constraint
--              update to support 'credito' payment method.
-- ===================================================================

-- -------------------------------------------------------------------
-- Step 1: Update CHECK constraint on ventas.metodo_pago to include 'credito'
--         Current: ('efectivo', 'pago_movil', 'transferencia', 'divisa', 'mixto')
--         New:     ('efectivo', 'pago_movil', 'transferencia', 'divisa', 'mixto', 'credito')
-- -------------------------------------------------------------------
alter table public.ventas
  drop constraint if exists ventas_metodo_pago_check;

alter table public.ventas
  add constraint ventas_metodo_pago_check
  check (metodo_pago in ('efectivo', 'pago_movil', 'transferencia', 'divisa', 'mixto', 'credito'));

-- -------------------------------------------------------------------
-- Step 2: Create sequence for venta invoice numbering
--         Format: VT-{YYYYMMDD}-{NNNN}
-- -------------------------------------------------------------------
create sequence if not exists public.seq_venta_number
  as integer
  minvalue 1
  maxvalue 9999
  cycle;

-- -------------------------------------------------------------------
-- Step 3: Create generate_sale_number() RPC
--         Returns next invoice number in VT-YYYYMMDD-NNNN format
-- -------------------------------------------------------------------
create or replace function public.generate_sale_number()
returns text
language sql
as $$
  select 'VT-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.seq_venta_number')::text, 4, '0')
$$;

-- -------------------------------------------------------------------
-- Step 4: Create create_sale_with_movements() RPC
--         SECURITY DEFINER wrapper that atomically:
--           1. Validates stock sufficiency (FOR UPDATE lock)
--           2. INSERTs ventas header (numero_factura from sequence)
--           3. INSERTs detalles_venta per item
--           4. INSERTs pagos_venta
--           5. CALLs record_inventory_movement('salida') per item
--         Returns { venta_id, numero_factura }
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
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    perform public.record_inventory_movement(
      p_producto_id     => (v_item->>'producto_id')::uuid,
      p_cantidad        => (v_item->>'cantidad')::numeric(10,2),
      p_tipo_movimiento => 'salida',
      p_referencia_tipo => 'sale',
      p_referencia_id   => v_venta_id::text,
      p_motivo          => 'Venta ' || v_venta_num
    );
  end loop;

  return jsonb_build_object(
    'venta_id', v_venta_id,
    'numero_factura', v_venta_num
  );
end;
$$;
