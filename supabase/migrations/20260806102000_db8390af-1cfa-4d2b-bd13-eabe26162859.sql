-- Revoke public/authenticated EXECUTE on privileged SECURITY DEFINER functions.
-- Trigger functions run as table owner, so revoking API access does not break triggers.
REVOKE EXECUTE ON FUNCTION public.claim_publishing_events(integer, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_product_social_hash(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.build_product_social_snapshot(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_product_social_hash(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_meta_connection_status() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_newsletter_campaign_audit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_newsletter_entity_audit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_publishing_event_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_publishing_event_transition() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_products_auto_ready_for_social() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_refresh_social_hash_images() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_refresh_social_hash_products() FROM anon, authenticated;

-- is_admin() must stay callable by signed-in users: RLS policies evaluate it as the caller.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Ensure backend/service access remains intact.
GRANT EXECUTE ON FUNCTION public.claim_publishing_events(integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_product_social_hash(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.build_product_social_snapshot(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.compute_product_social_hash(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_meta_connection_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;