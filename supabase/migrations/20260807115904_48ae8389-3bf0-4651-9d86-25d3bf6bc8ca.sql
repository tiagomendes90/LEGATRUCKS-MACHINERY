ALTER TABLE public.newsletter_sends ADD COLUMN IF NOT EXISTS language text;
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_language ON public.newsletter_sends(campaign_id, language);