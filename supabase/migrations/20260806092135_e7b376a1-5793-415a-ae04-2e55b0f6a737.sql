DROP VIEW IF EXISTS public.meta_connection_status;

CREATE OR REPLACE FUNCTION public.get_meta_connection_status()
RETURNS TABLE (
  id uuid,
  provider text,
  status text,
  page_id text,
  page_name text,
  page_picture_url text,
  ig_user_id text,
  ig_username text,
  ig_profile_picture_url text,
  token_expires_at timestamptz,
  has_page_token boolean,
  scopes text[],
  connected_at timestamptz,
  last_checked_at timestamptz,
  last_error text,
  is_active boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.provider, c.status, c.page_id, c.page_name, c.page_picture_url,
         c.ig_user_id, c.ig_username, c.ig_profile_picture_url, c.token_expires_at,
         (c.page_access_token IS NOT NULL), c.scopes, c.connected_at, c.last_checked_at,
         c.last_error, c.is_active, c.updated_at
  FROM public.meta_connections c
  WHERE public.is_admin()
  ORDER BY c.is_active DESC, c.updated_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_meta_connection_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_meta_connection_status() TO authenticated, service_role;