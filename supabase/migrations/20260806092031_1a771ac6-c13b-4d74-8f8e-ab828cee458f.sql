CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.meta_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'meta',
  status text NOT NULL DEFAULT 'connected',
  page_id text,
  page_name text,
  page_picture_url text,
  ig_user_id text,
  ig_username text,
  ig_profile_picture_url text,
  page_access_token text,
  user_access_token text,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  connected_by uuid,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_checked_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.meta_connections TO service_role;
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_connections service only"
  ON public.meta_connections FOR ALL
  USING (false) WITH CHECK (false);

CREATE UNIQUE INDEX IF NOT EXISTS meta_connections_single_active
  ON public.meta_connections (provider) WHERE is_active;

CREATE TRIGGER trg_meta_connections_updated_at
  BEFORE UPDATE ON public.meta_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.meta_oauth_states (
  state text PRIMARY KEY,
  created_by uuid,
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '15 minutes'
);

GRANT ALL ON public.meta_oauth_states TO service_role;
ALTER TABLE public.meta_oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_oauth_states service only"
  ON public.meta_oauth_states FOR ALL
  USING (false) WITH CHECK (false);

CREATE OR REPLACE VIEW public.meta_connection_status AS
  SELECT
    c.id,
    c.provider,
    c.status,
    c.page_id,
    c.page_name,
    c.page_picture_url,
    c.ig_user_id,
    c.ig_username,
    c.ig_profile_picture_url,
    c.token_expires_at,
    (c.page_access_token IS NOT NULL) AS has_page_token,
    c.scopes,
    c.connected_at,
    c.last_checked_at,
    c.last_error,
    c.is_active,
    c.updated_at
  FROM public.meta_connections c
  WHERE public.is_admin();

GRANT SELECT ON public.meta_connection_status TO authenticated;