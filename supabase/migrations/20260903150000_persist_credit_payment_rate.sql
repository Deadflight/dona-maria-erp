-- Persist the exchange-rate context used by credit payments.

alter table public.abonos_creditos
  add column if not exists tasa_cambio_usd_a_ves numeric(14,4),
  add column if not exists fuente_tasa text;

create or replace function public.set_abono_exchange_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_rate numeric(14,4);
  current_source text;
begin
  select tasa, fuente into current_rate, current_source
  from public.tasas_cambio
  where activa = true
  order by created_at desc
  limit 1;

  if current_rate is not null then
    new.tasa_cambio_usd_a_ves := current_rate;
    new.fuente_tasa := current_source;
  end if;

  return new;
end;
$$;

drop trigger if exists set_abono_exchange_rate_on_insert on public.abonos_creditos;

create trigger set_abono_exchange_rate_on_insert
before insert on public.abonos_creditos
for each row
execute function public.set_abono_exchange_rate();
