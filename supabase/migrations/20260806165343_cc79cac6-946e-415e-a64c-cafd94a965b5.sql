CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_social_sync()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  v_secret text;
  v_req_id bigint;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'SOCIAL_SYNC_CRON_SECRET'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  IF v_secret IS NULL THEN
    RAISE NOTICE 'SOCIAL_SYNC_CRON_SECRET not available in vault; skipping.';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := 'https://dzljzvkshlgnmwpvweas.supabase.co/functions/v1/social-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := jsonb_build_object('limit', 200)
  ) INTO v_req_id;

  RETURN v_req_id;
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_social_sync() FROM public, anon, authenticated;

SELECT cron.unschedule('social-sync-every-15-min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'social-sync-every-15-min');

SELECT cron.schedule(
  'social-sync-every-15-min',
  '*/15 * * * *',
  $$SELECT public.trigger_social_sync();$$
);