-- =========================================================================
-- Fase 2.5 — Newsletter infrastructure
-- =========================================================================

-- ---- newsletter_subscribers -----------------------------------------------
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  last_name text,
  status text NOT NULL DEFAULT 'active',           -- active | unsubscribed | bounced
  consent boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'footer_form',       -- footer_form | admin | import | api
  resend_contact_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_lower_unique UNIQUE (email),
  CONSTRAINT newsletter_subscribers_status_chk CHECK (status IN ('active','unsubscribed','bounced')),
  CONSTRAINT newsletter_subscribers_unsub_token_unique UNIQUE (unsubscribe_token)
);

CREATE INDEX newsletter_subscribers_status_idx ON public.newsletter_subscribers(status);
CREATE INDEX newsletter_subscribers_email_lower_idx ON public.newsletter_subscribers(lower(email));

GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT INSERT ON public.newsletter_subscribers TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage subscribers"
  ON public.newsletter_subscribers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ---- newsletter_campaigns -------------------------------------------------
CREATE TABLE public.newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  preheader text,
  status text NOT NULL DEFAULT 'draft',   -- draft | ready | scheduled | sending | sent | failed | canceled
  product_ids uuid[] NOT NULL DEFAULT '{}',
  template_key text NOT NULL DEFAULT 'product_showcase_v1',
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_html text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  broadcast_id text,
  last_error text,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_campaigns_status_chk CHECK (status IN
    ('draft','ready','scheduled','sending','sent','failed','canceled'))
);

CREATE INDEX newsletter_campaigns_status_idx ON public.newsletter_campaigns(status);
CREATE INDEX newsletter_campaigns_created_at_idx ON public.newsletter_campaigns(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_campaigns TO authenticated;
GRANT ALL ON public.newsletter_campaigns TO service_role;

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns"
  ON public.newsletter_campaigns FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER newsletter_campaigns_updated_at
  BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ---- newsletter_sends -----------------------------------------------------
CREATE TABLE public.newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  channel_key text NOT NULL DEFAULT 'newsletter',
  status text NOT NULL DEFAULT 'queued',   -- queued | sent | failed | bounced | complained | unsubscribed
  recipients_count integer,
  resend_message_id text,
  broadcast_id text,
  error text,
  raw_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_sends_status_chk CHECK (status IN
    ('queued','sent','failed','bounced','complained','unsubscribed'))
);

CREATE INDEX newsletter_sends_campaign_idx ON public.newsletter_sends(campaign_id, created_at DESC);
CREATE INDEX newsletter_sends_status_idx ON public.newsletter_sends(status);

GRANT SELECT ON public.newsletter_sends TO authenticated;
GRANT ALL ON public.newsletter_sends TO service_role;

ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read sends"
  ON public.newsletter_sends FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER newsletter_sends_updated_at
  BEFORE UPDATE ON public.newsletter_sends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ---- Ensure newsletter channel row exists ---------------------------------
INSERT INTO public.publishing_channels (key, label, enabled, config)
VALUES ('newsletter', 'Newsletter', true, '{}'::jsonb)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label;
