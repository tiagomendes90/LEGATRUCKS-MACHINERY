
REVOKE ALL ON FUNCTION public.log_publishing_event_transition() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_publishing_event_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fill_publishing_event_dedupe_key() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_dedupe_key(text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_dedupe_key(text, uuid, jsonb) TO service_role;
