-- Persist the source of the historical exchange rate used by a sale.

alter table public.ventas
  add column if not exists fuente_tasa text;

create or replace function public.create_sale_with_movements(
  p_cliente_id uuid,
  p_vendedor_id uuid,
  p_metodo_pago text,
  p_subtotal numeric,
  p_impuesto numeric,
  p_total numeric,
  p_items jsonb,
  p_tasa_cambio_usd_a_ves numeric,
  p_fuente_tasa text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  sale_id uuid;
begin
  result := public.create_sale_with_movements(
    p_cliente_id,
    p_vendedor_id,
    p_metodo_pago,
    p_subtotal,
    p_impuesto,
    p_total,
    p_items,
    p_tasa_cambio_usd_a_ves
  );

  sale_id := (result->>'venta_id')::uuid;
  update public.ventas
  set fuente_tasa = p_fuente_tasa
  where id = sale_id;

  return result;
end;
$$;
