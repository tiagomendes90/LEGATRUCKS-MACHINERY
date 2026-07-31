-- 1. Listas: arquivo
ALTER TABLE public.newsletter_lists
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. Campanhas: segmentação múltipla + estatísticas estruturadas
ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS list_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audience_mode text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS send_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS send_finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS recipients_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivered_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opened_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_count integer NOT NULL DEFAULT 0;

-- Compatibilidade: campanhas antigas com list_id único
UPDATE public.newsletter_campaigns
   SET list_ids = ARRAY[list_id], audience_mode = 'lists'
 WHERE list_id IS NOT NULL AND cardinality(list_ids) = 0;

-- 3. Envios: nunca duplicar um envio bem-sucedido
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_sends_unique_success
  ON public.newsletter_sends (campaign_id, subscriber_id)
  WHERE status = 'sent' AND subscriber_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS newsletter_sends_campaign_status_idx
  ON public.newsletter_sends (campaign_id, status);

-- 4. Auditoria de email marketing
CREATE TABLE IF NOT EXISTS public.newsletter_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  actor_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.newsletter_audit_log TO authenticated;
GRANT ALL ON public.newsletter_audit_log TO service_role;

ALTER TABLE public.newsletter_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read newsletter audit log" ON public.newsletter_audit_log;
CREATE POLICY "Admins can read newsletter audit log"
  ON public.newsletter_audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS newsletter_audit_entity_idx
  ON public.newsletter_audit_log (entity_type, entity_id, created_at DESC);

-- 5. Triggers de auditoria automática
CREATE OR REPLACE FUNCTION public.log_newsletter_campaign_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'campaign.created';
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.newsletter_audit_log (entity_type, entity_id, action, actor_id, details)
    VALUES ('campaign', OLD.id, 'campaign.deleted', auth.uid(),
            jsonb_build_object('title', OLD.title, 'status', OLD.status));
    RETURN OLD;
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := CASE NEW.status
        WHEN 'sent' THEN 'campaign.sent'
        WHEN 'sending' THEN 'campaign.sending'
        WHEN 'scheduled' THEN 'campaign.scheduled'
        WHEN 'canceled' THEN 'campaign.canceled'
        WHEN 'failed' THEN 'campaign.failed'
        ELSE 'campaign.status_changed'
      END;
    ELSE
      v_action := 'campaign.updated';
    END IF;
  END IF;

  INSERT INTO public.newsletter_audit_log (entity_type, entity_id, action, actor_id, details)
  VALUES ('campaign', NEW.id, v_action, auth.uid(),
          jsonb_build_object(
            'title', NEW.title,
            'status', NEW.status,
            'previous_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
            'audience_mode', NEW.audience_mode,
            'recipients', NEW.recipients_count,
            'sent', NEW.sent_count,
            'failed', NEW.failed_count,
            'scheduled_for', NEW.scheduled_for
          ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_newsletter_campaign_audit ON public.newsletter_campaigns;
CREATE TRIGGER trg_newsletter_campaign_audit
AFTER INSERT OR UPDATE OR DELETE ON public.newsletter_campaigns
FOR EACH ROW EXECUTE FUNCTION public.log_newsletter_campaign_audit();

CREATE OR REPLACE FUNCTION public.log_newsletter_entity_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entity text := CASE TG_TABLE_NAME
    WHEN 'newsletter_lists' THEN 'list'
    WHEN 'newsletter_templates' THEN 'template'
    ELSE TG_TABLE_NAME
  END;
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.newsletter_audit_log (entity_type, entity_id, action, actor_id, details)
    VALUES (v_entity, OLD.id, v_entity || '.deleted', auth.uid(), jsonb_build_object('name', OLD.name));
    RETURN OLD;
  END IF;

  INSERT INTO public.newsletter_audit_log (entity_type, entity_id, action, actor_id, details)
  VALUES (v_entity, NEW.id,
          v_entity || CASE WHEN TG_OP = 'INSERT' THEN '.created' ELSE '.updated' END,
          auth.uid(), jsonb_build_object('name', NEW.name));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_newsletter_lists_audit ON public.newsletter_lists;
CREATE TRIGGER trg_newsletter_lists_audit
AFTER INSERT OR UPDATE OR DELETE ON public.newsletter_lists
FOR EACH ROW EXECUTE FUNCTION public.log_newsletter_entity_audit();

DROP TRIGGER IF EXISTS trg_newsletter_templates_audit ON public.newsletter_templates;
CREATE TRIGGER trg_newsletter_templates_audit
AFTER INSERT OR UPDATE OR DELETE ON public.newsletter_templates
FOR EACH ROW EXECUTE FUNCTION public.log_newsletter_entity_audit();

-- 6. updated_at automático nas tabelas de email marketing
DROP TRIGGER IF EXISTS trg_newsletter_campaigns_updated ON public.newsletter_campaigns;
CREATE TRIGGER trg_newsletter_campaigns_updated
BEFORE UPDATE ON public.newsletter_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_newsletter_lists_updated ON public.newsletter_lists;
CREATE TRIGGER trg_newsletter_lists_updated
BEFORE UPDATE ON public.newsletter_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_newsletter_templates_updated ON public.newsletter_templates;
CREATE TRIGGER trg_newsletter_templates_updated
BEFORE UPDATE ON public.newsletter_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();