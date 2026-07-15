
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.publishing_events
  ADD COLUMN IF NOT EXISTS retry_cycle integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.compute_dedupe_key(
  p_event_type text,
  p_product_id uuid,
  p_payload jsonb
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(
    extensions.digest(
      (coalesce(p_event_type, '') || '|' ||
       coalesce(p_product_id::text, '') || '|' ||
       coalesce(p_payload::text, '{}'))::bytea,
      'sha256'
    ),
    'hex'
  )
$$;

CREATE OR REPLACE FUNCTION public.fill_publishing_event_dedupe_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.dedupe_key IS NULL THEN
    NEW.dedupe_key := public.compute_dedupe_key(
      NEW.event_type, NEW.product_id, NEW.payload
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_dedupe_key ON public.publishing_events;
CREATE TRIGGER trg_fill_dedupe_key
  BEFORE INSERT ON public.publishing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_publishing_event_dedupe_key();

CREATE TABLE IF NOT EXISTS public.publishing_event_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.publishing_events(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  attempts integer,
  retry_cycle integer,
  worker text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_event_id
  ON public.publishing_event_transitions(event_id, created_at);

GRANT SELECT ON public.publishing_event_transitions TO authenticated;
GRANT ALL ON public.publishing_event_transitions TO service_role;

ALTER TABLE public.publishing_event_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view transitions"
  ON public.publishing_event_transitions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.log_publishing_event_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.publishing_event_transitions
      (event_id, from_status, to_status, attempts, retry_cycle, worker, reason)
    VALUES
      (NEW.id, OLD.status, NEW.status, NEW.attempts, NEW.retry_cycle,
       NEW.locked_by, NEW.last_error);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_event_transition ON public.publishing_events;
CREATE TRIGGER trg_log_event_transition
  AFTER UPDATE OF status ON public.publishing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.log_publishing_event_transition();

CREATE OR REPLACE FUNCTION public.log_publishing_event_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.publishing_event_transitions
    (event_id, from_status, to_status, attempts, retry_cycle, worker, reason)
  VALUES
    (NEW.id, NULL, NEW.status, NEW.attempts, NEW.retry_cycle, NULL, 'created');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_event_insert ON public.publishing_events;
CREATE TRIGGER trg_log_event_insert
  AFTER INSERT ON public.publishing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.log_publishing_event_insert();
