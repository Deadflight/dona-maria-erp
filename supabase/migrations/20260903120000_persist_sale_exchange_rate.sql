-- Persist the USD/VES conversion used when a sale is created.

alter table public.ventas
  add column if not exists tasa_cambio_usd_a_ves numeric(14,4),
  add column if not exists total_ves numeric(14,2);

create or replace function public.set_sale_exchange_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_rate numeric(14,4);
begin
  select tasa into current_rate
  from public.tasas_cambio
  where activa = true
  order by created_at desc
  limit 1;

  if current_rate is not null then
    new.tasa_cambio_usd_a_ves := current_rate;
    new.total_ves := round(new.total * current_rate, 2);
  end if;

  return new;
end;
$$;

drop trigger if exists set_sale_exchange_rate_on_insert on public.ventas;

create trigger set_sale_exchange_rate_on_insert
before insert on public.ventas
for each row
execute function public.set_sale_exchange_rate();

-- Keep the existing seven-argument RPC compatible while allowing the caller to
-- persist the exact rate it validated before the RPC call.
create or replace function public.create_sale_with_movements(
  p_cliente_id uuid,
  p_vendedor_id uuid,
  p_metodo_pago text,
  p_subtotal numeric,
  p_impuesto numeric,
  p_total numeric,
  p_items jsonb,
  p_tasa_cambio_usd_a_ves numeric
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
    p_items
  );

  sale_id := (result->>'venta_id')::uuid;
  update public.ventas
  set tasa_cambio_usd_a_ves = p_tasa_cambio_usd_a_ves,
      total_ves = round(p_total * p_tasa_cambio_usd_a_ves, 2)
  where id = sale_id;

  return result;
end;
$$;
