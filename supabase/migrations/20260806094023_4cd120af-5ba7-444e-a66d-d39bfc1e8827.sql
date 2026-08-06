CREATE UNIQUE INDEX IF NOT EXISTS meta_connections_single_active
  ON public.meta_connections (provider)
  WHERE is_active;