
-- =========================
-- publishing_channels
-- =========================
CREATE TABLE public.publishing_channels (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_channels TO authenticated;
GRANT ALL ON public.publishing_channels TO service_role;

ALTER TABLE public.publishing_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage publishing_channels"
  ON public.publishing_channels FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_publishing_channels_updated_at
  BEFORE UPDATE ON public.publishing_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- publishing_events
-- =========================
CREATE TABLE public.publishing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  product_id UUID NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_publishing_events_status ON public.publishing_events(status);
CREATE INDEX idx_publishing_events_created_at ON public.publishing_events(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_events TO authenticated;
GRANT ALL ON public.publishing_events TO service_role;

ALTER TABLE public.publishing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read publishing_events"
  ON public.publishing_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins insert publishing_events"
  ON public.publishing_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update publishing_events"
  ON public.publishing_events FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================
-- publishing_logs
-- =========================
CREATE TABLE public.publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NULL REFERENCES public.publishing_events(id) ON DELETE CASCADE,
  channel_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','failed','skipped','pending')),
  request JSONB NOT NULL DEFAULT '{}'::jsonb,
  response JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT NULL,
  attempts INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_publishing_logs_event ON public.publishing_logs(event_id);
CREATE INDEX idx_publishing_logs_channel ON public.publishing_logs(channel_key);
CREATE INDEX idx_publishing_logs_created_at ON public.publishing_logs(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_logs TO authenticated;
GRANT ALL ON public.publishing_logs TO service_role;

ALTER TABLE public.publishing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read publishing_logs"
  ON public.publishing_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- =========================
-- Seed initial channels (disabled)
-- =========================
INSERT INTO public.publishing_channels (key, label, enabled, config) VALUES
  ('sitemap', 'Sitemap', false, '{}'::jsonb),
  ('facebook', 'Facebook', false, '{}'::jsonb),
  ('instagram', 'Instagram', false, '{}'::jsonb),
  ('newsletter', 'Newsletter', false, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
