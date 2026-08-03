ALTER TABLE public.publishing_logs DROP CONSTRAINT IF EXISTS publishing_logs_status_check;
ALTER TABLE public.publishing_logs ADD CONSTRAINT publishing_logs_status_check
  CHECK (status = ANY (ARRAY['success','failed','skipped','missing_credentials','pending']));

ALTER TABLE public.publishing_events DROP CONSTRAINT IF EXISTS publishing_events_status_check;
ALTER TABLE public.publishing_events ADD CONSTRAINT publishing_events_status_check
  CHECK (status = ANY (ARRAY['pending','processing','completed','skipped','missing_credentials','failed']));