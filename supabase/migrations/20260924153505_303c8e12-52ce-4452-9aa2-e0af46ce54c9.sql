CREATE TABLE public.newsletter_send_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  email text NOT NULL,
  language text,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  next_attempt_at timestamptz,
  locked_at timestamptz,
  resend_message_id text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_send_queue_status_chk CHECK (status IN ('pending','processing','sent','failed','skipped')),
  CONSTRAINT newsletter_send_queue_unique UNIQUE (campaign_id, subscriber_id)
);
CREATE INDEX newsletter_send_queue_campaign_status_idx ON public.newsletter_send_queue (campaign_id, status);
CREATE INDEX newsletter_send_queue_sent_at_idx ON public.newsletter_send_queue (sent_at) WHERE status = 'sent';

GRANT SELECT ON public.newsletter_send_queue TO authenticated;
GRANT ALL ON public.newsletter_send_queue TO service_role;
ALTER TABLE public.newsletter_send_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read send queue" ON public.newsletter_send_queue
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE TRIGGER trg_newsletter_send_queue_updated
  BEFORE UPDATE ON public.newsletter_send_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS queue_locked_until timestamptz;

-- Lock single-flight por campanha (lease com expiração).
CREATE OR REPLACE FUNCTION public.claim_newsletter_campaign_lock(p_campaign_id uuid, p_seconds integer DEFAULT 300)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_ok boolean;
BEGIN
  UPDATE public.newsletter_campaigns
     SET queue_locked_until = now() + make_interval(secs => p_seconds)
   WHERE id = p_campaign_id
     AND (queue_locked_until IS NULL OR queue_locked_until < now())
  RETURNING true INTO v_ok;
  RETURN coalesce(v_ok, false);
END; $$;
REVOKE ALL ON FUNCTION public.claim_newsletter_campaign_lock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_newsletter_campaign_lock(uuid, integer) TO service_role;