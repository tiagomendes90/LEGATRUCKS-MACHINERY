ALTER TABLE public.newsletter_campaigns DROP CONSTRAINT newsletter_campaigns_status_chk;
ALTER TABLE public.newsletter_campaigns ADD CONSTRAINT newsletter_campaigns_status_chk
  CHECK (status = ANY (ARRAY['draft','ready','scheduled','sending','paused','sent','failed','canceled']));

ALTER TABLE public.newsletter_sends DROP CONSTRAINT IF EXISTS newsletter_sends_status_check;
DO $$ DECLARE c text; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.newsletter_sends'::regclass AND contype='c'
           AND pg_get_constraintdef(oid) ILIKE '%status%' LOOP
    EXECUTE format('ALTER TABLE public.newsletter_sends DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE public.newsletter_sends ADD CONSTRAINT newsletter_sends_status_check
  CHECK (status = ANY (ARRAY['queued','sent','failed','skipped','bounced','complained','unsubscribed']));

UPDATE public.newsletter_campaigns
   SET status = 'paused', next_run_at = NULL
 WHERE id = 'b765fb7a-4c95-4b1f-abef-88fe244c4587' AND status = 'sending';