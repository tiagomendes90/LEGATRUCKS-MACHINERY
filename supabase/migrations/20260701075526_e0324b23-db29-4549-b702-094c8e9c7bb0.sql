
-- Expand status values and relax source constraint to support any future form kind
ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_status_check;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_status_check
  CHECK (status = ANY (ARRAY['unread'::text, 'read'::text, 'answered'::text, 'archived'::text]));

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_source_check;

CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS contact_messages_source_idx ON public.contact_messages(source);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON public.contact_messages(created_at DESC);
