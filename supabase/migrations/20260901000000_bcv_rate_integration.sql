-- Daily BCV rate sync job for the ERP
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.bcv_sync_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running', 'success', 'failed')),
  error_message text,
  attempts integer not null default 0
);

alter table public.bcv_sync_runs enable row level security;

create policy "bcv_sync_runs_admin_read" on public.bcv_sync_runs
  for select to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- Schedule a daily sync at 08:00 VET (12:00 UTC) to hit the Supabase Edge Function.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'fetch-tasa-bcv',
      '0 12 * * *',
      $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/fetch-tasa-bcv',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
          'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        body := '{"trigger":"daily-sync"}'::jsonb,
        timeout_milliseconds := 60000
      )
      $cron$
    );
  end if;
end $$;

-- The function keeps the previous active rate if the BCV request fails.
create or replace function public.refresh_bcv_rate_snapshot()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  null;
end;
$$;
