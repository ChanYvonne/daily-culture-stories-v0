-- Run this after deploying the generate-daily-story function and after setting
-- your OPENAI_API_KEY and CRON_SECRET function secrets.
-- Replace the placeholder project ref, YOUR_CRON_SECRET, and YOUR_SUPABASE_ANON_KEY
-- before executing.

select
  cron.schedule(
    'generate-daily-culture-story',
    '5 9 * * *',
    $$
    select
      net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-story',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', 'YOUR_CRON_SECRET',
          'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
        ),
        body := '{"force": false}'::jsonb
      ) as request_id;
    $$
  );
