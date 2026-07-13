
-- ============================================================
-- FASE 2.0 — Pipeline de publicação: fundações
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ------------------------------------------------------------
-- 1) publishing_events: novos campos para scheduling / retries / lock / dedupe
-- ------------------------------------------------------------
ALTER TABLE public.publishing_events
  ADD COLUMN IF NOT EXISTS scheduled_for   timestamptz,
  ADD COLUMN IF NOT EXISTS attempts        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_at       timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by       text,
  ADD COLUMN IF NOT EXISTS dedupe_key      text,
  ADD COLUMN IF NOT EXISTS last_error      text;

-- Índice para o dispatcher escolher rapidamente eventos elegíveis
CREATE INDEX IF NOT EXISTS idx_publishing_events_dispatch
  ON public.publishing_events (status, next_attempt_at NULLS FIRST, created_at)
  WHERE status IN ('pending', 'scheduled', 'failed');

-- Dedupe: impede o mesmo (event_type, product_id, dedupe_key) duas vezes
CREATE UNIQUE INDEX IF NOT EXISTS uq_publishing_events_dedupe
  ON public.publishing_events (event_type, product_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- ------------------------------------------------------------
-- 2) products: social_status + social_hash
-- ------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS social_status text NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS social_hash   text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_social_status_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_social_status_check
      CHECK (social_status IN ('not_ready','ready_for_social','published','outdated','failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_social_status
  ON public.products (social_status);

-- ------------------------------------------------------------
-- 3) product_social_posts — persistência de posts externos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_social_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid REFERENCES public.products(id) ON DELETE CASCADE,
  event_id        uuid REFERENCES public.publishing_events(id) ON DELETE SET NULL,
  channel_key     text NOT NULL,
  external_id     text,
  external_url    text,
  caption         text,
  media           jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'live',
  published_at    timestamptz NOT NULL DEFAULT now(),
  raw_response    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_social_posts_status_check
    CHECK (status IN ('live','deleted','failed','pending'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_social_posts_external
  ON public.product_social_posts (channel_key, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_social_posts_product
  ON public.product_social_posts (product_id, channel_key);

GRANT SELECT ON public.product_social_posts TO authenticated;
GRANT ALL ON public.product_social_posts TO service_role;

ALTER TABLE public.product_social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view social posts"
  ON public.product_social_posts FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can manage social posts"
  ON public.product_social_posts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_product_social_posts_updated_at
  BEFORE UPDATE ON public.product_social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 4) publishing_metrics — snapshots de métricas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publishing_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES public.product_social_posts(id) ON DELETE CASCADE,
  channel_key     text NOT NULL,
  likes           integer,
  comments        integer,
  shares          integer,
  reach           integer,
  impressions     integer,
  clicks          integer,
  raw             jsonb NOT NULL DEFAULT '{}'::jsonb,
  collected_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publishing_metrics_post
  ON public.publishing_metrics (post_id, collected_at DESC);

GRANT SELECT ON public.publishing_metrics TO authenticated;
GRANT ALL ON public.publishing_metrics TO service_role;

ALTER TABLE public.publishing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view metrics"
  ON public.publishing_metrics FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role manages metrics"
  ON public.publishing_metrics FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 5) Função: lock atómico para o dispatcher (pending/scheduled/failed -> processing)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_publishing_events(
  p_limit int DEFAULT 20,
  p_worker text DEFAULT 'dispatcher'
)
RETURNS SETOF public.publishing_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH cte AS (
    SELECT id
    FROM public.publishing_events
    WHERE status IN ('pending','scheduled','failed')
      AND (scheduled_for  IS NULL OR scheduled_for  <= now())
      AND (next_attempt_at IS NULL OR next_attempt_at <= now())
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.publishing_events e
     SET status    = 'processing',
         locked_at = now(),
         locked_by = p_worker,
         attempts  = e.attempts + 1
    FROM cte
   WHERE e.id = cte.id
  RETURNING e.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_publishing_events(int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_publishing_events(int, text) TO service_role;

-- ------------------------------------------------------------
-- 6) Cron: chama publish-dispatcher a cada 5 minutos
-- ------------------------------------------------------------
DO $$
DECLARE
  jid int;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'publish-dispatcher-every-5min';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'publish-dispatcher-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://dzljzvkshlgnmwpvweas.supabase.co/functions/v1/publish-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGp6dmtzaGxnbm13cHZ3ZWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDk4MjksImV4cCI6MjA4ODIyNTgyOX0.xTTDzaZQQs73Kex9ZmUUNWxC5qdyT9N9tGjvDMt_j4E'
    ),
    body := jsonb_build_object('source','cron','at', now())
  );
  $cron$
);
