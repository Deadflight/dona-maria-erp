-- ===================================================================
-- Migration: credit_sales_abonos
-- Description: Re-creates create_sale_with_movements with a credit
--              branch (client FOR UPDATE + limit check, creditos
--              ledger row, clientes.saldo_actual bump, venta
--              estado='credito', no pagos_venta for credit sales)
--              and adds the register_abono security-definer RPC plus
--              a seller INSERT policy on abonos_creditos.
--              Non-credit path is byte-identical to 20260806000000
--              (discount computation, stock locks, _skip_lock contract).
-- PR: A35 PR 1 — Migration + Unit Tests
-- ===================================================================

-- -------------------------------------------------------------------
-- Step 1: Drop existing create_sale_with_movements
-- -------------------------------------------------------------------
drop function if exists public.create_sale_with_movements(p_cliente_id uuid, p_vendedor_id uuid, p_metodo_pago text, p_subtotal numeric, p_impuesto numeric, p_total numeric, p_items jsonb);

-- -------------------------------------------------------------------
-- Step 2: Re-create create_sale_with_movements with credit branch
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
  v_limite_credito   numeric(14,2);
  v_saldo_actual     numeric(14,2);
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

  -- Credit branch: verify client credit eligibility (row-level lock prevents races)
  if p_metodo_pago = 'credito' then
    select limite_credito, saldo_actual into v_limite_credito, v_saldo_actual
    from public.clientes
    where id = p_cliente_id
    for update;

    if not found then
      raise exception 'Cliente no encontrado: %', p_cliente_id;
    end if;

    if v_limite_credito = 0 then
      raise exception 'El cliente no tiene crédito habilitado';
    end if;

    if v_saldo_actual + p_total > v_limite_credito then
      raise exception 'El cliente excede su límite de crédito: saldo actual=%, total=%, límite=%',
        v_saldo_actual, p_total, v_limite_credito;
    end if;
  end if;

  -- Generate invoice number
  v_venta_num := public.generate_sale_number();

  -- 1. Insert venta header (estado explicit: 'credito' for credit sales)
  insert into public.ventas
    (numero_factura, cliente_id, vendedor_id, subtotal, impuesto, total, metodo_pago, estado)
  values
    (v_venta_num, p_cliente_id, p_vendedor_id, p_subtotal, p_impuesto, p_total, p_metodo_pago,
     case when p_metodo_pago = 'credito' then 'credito' else 'completada' end)
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

  -- 3. Insert pagos_venta — skipped entirely for credit sales (creditos replaces it)
  if p_metodo_pago <> 'credito' then
    insert into public.pagos_venta
      (venta_id, monto, metodo_pago)
    values
      (v_venta_id, p_total, p_metodo_pago);
  end if;

  -- 3b. Credit ledger — one credit per credit sale; bump the client's balance
  if p_metodo_pago = 'credito' then
    insert into public.creditos
      (cliente_id, venta_id, monto_original, saldo_pendiente, tasa_interes, cuotas, fecha_otorgamiento, fecha_vencimiento, estado)
    values
      (p_cliente_id, v_venta_id, p_total, p_total, 0, 1, current_date, current_date + interval '30 days', 'activo');

    update public.clientes
    set saldo_actual = v_saldo_actual + p_total,
        updated_at = now()
    where id = p_cliente_id;
  end if;

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

-- -------------------------------------------------------------------
-- Step 3: register_abono — atomic abono registration
-- -------------------------------------------------------------------
-- Locks the credit and client rows FOR UPDATE to serialize concurrent
-- abonos, rejects monto <= 0 and overpayment, inserts the abono row,
-- decrements both balances, and flips estado='cancelado' when the
-- pending balance reaches 0.
create or replace function public.register_abono(
  p_credito_id   uuid,
  p_monto        numeric(14,2),
  p_metodo_pago  text,
  p_referencia   text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_saldo_pendiente numeric(14,2);
  v_saldo_actual    numeric(14,2);
  v_cliente_id      uuid;
  v_estado          text;
begin
  if p_monto <= 0 then
    raise exception 'El monto del abono debe ser mayor a cero';
  end if;

  -- Lock the credit row (serializes concurrent abonos on the same credit)
  select saldo_pendiente, cliente_id into v_saldo_pendiente, v_cliente_id
  from public.creditos
  where id = p_credito_id
  for update;

  if not found then
    raise exception 'Crédito no encontrado: %', p_credito_id;
  end if;

  -- Lock the client row (serializes concurrent balance updates)
  select saldo_actual into v_saldo_actual
  from public.clientes
  where id = v_cliente_id
  for update;

  if p_monto > v_saldo_pendiente then
    raise exception 'El abono excede el saldo pendiente: pendiente=%, monto=%',
      v_saldo_pendiente, p_monto;
  end if;

  insert into public.abonos_creditos
    (credito_id, monto, metodo_pago, referencia)
  values
    (p_credito_id, p_monto, p_metodo_pago, p_referencia);

  update public.creditos
  set saldo_pendiente = saldo_pendiente - p_monto,
      estado = case when saldo_pendiente - p_monto = 0 then 'cancelado' else estado end
  where id = p_credito_id
  returning saldo_pendiente, estado into v_saldo_pendiente, v_estado;

  update public.clientes
  set saldo_actual = saldo_actual - p_monto,
      updated_at = now()
  where id = v_cliente_id
  returning saldo_actual into v_saldo_actual;

  return jsonb_build_object(
    'credito_id', p_credito_id,
    'saldo_pendiente', v_saldo_pendiente,
    'saldo_actual', v_saldo_actual,
    'estado', v_estado
  );
end;
$$;

-- -------------------------------------------------------------------
-- Step 4: Seller INSERT policy on abonos_creditos
-- -------------------------------------------------------------------
-- admin ALL and seller/viewer SELECT already exist (20260530000009);
-- this adds seller INSERT. Viewer and unauthenticated INSERT stay denied.
create policy "seller_insert_abonos_creditos" on public.abonos_creditos
  for insert to authenticated
  with check (public.get_user_role() = 'seller');
