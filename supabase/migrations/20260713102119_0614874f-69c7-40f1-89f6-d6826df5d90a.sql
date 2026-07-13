
-- Remover policy redundante (service_role bypassa RLS por definição)
DROP POLICY IF EXISTS "Service role manages metrics" ON public.publishing_metrics;

-- Restringir execução da função SECURITY DEFINER apenas ao service_role
REVOKE ALL ON FUNCTION public.claim_publishing_events(int, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_publishing_events(int, text) FROM anon;
REVOKE ALL ON FUNCTION public.claim_publishing_events(int, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_publishing_events(int, text) TO service_role;
