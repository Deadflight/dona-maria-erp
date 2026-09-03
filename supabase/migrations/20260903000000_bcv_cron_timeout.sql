-- Allow the BCV Edge Function retries to complete before pg_net times out.
select cron.unschedule('fetch-tasa-bcv');

select cron.schedule(
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
