CREATE OR REPLACE FUNCTION public.compute_dedupe_key(p_event_type text, p_product_id uuid, p_payload jsonb)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT encode(
    extensions.digest(
      convert_to(
        coalesce(p_event_type, '') || '|' ||
        coalesce(p_product_id::text, '') || '|' ||
        coalesce(p_payload::text, '{}'),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  )
$function$;

CREATE OR REPLACE FUNCTION public.compute_product_social_hash(p_product_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT encode(
    extensions.digest(
      convert_to((public.build_product_social_snapshot(p_product_id))::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$function$;

CREATE OR REPLACE FUNCTION public.refresh_product_social_hash(p_product_id uuid, p_source text DEFAULT 'unknown'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_new_hash text;
  v_old_hash text;
  v_old_snap jsonb;
  v_new_snap jsonb;
  v_current_status text;
  v_changed jsonb;
BEGIN
  SELECT social_hash, social_status
    INTO v_old_hash, v_current_status
    FROM public.products
   WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_new_snap := public.build_product_social_snapshot(p_product_id);
  v_new_hash := encode(
    extensions.digest(convert_to(v_new_snap::text, 'UTF8'), 'sha256'),
    'hex'
  );

  IF v_new_hash IS DISTINCT FROM v_old_hash THEN
    SELECT new_snapshot INTO v_old_snap
      FROM public.product_social_hash_audit
     WHERE product_id = p_product_id
     ORDER BY created_at DESC
     LIMIT 1;

    v_changed := public.diff_social_snapshots(v_old_snap, v_new_snap);

    INSERT INTO public.product_social_hash_audit
      (product_id, old_hash, new_hash, changed_fields, old_snapshot, new_snapshot, source)
    VALUES
      (p_product_id, v_old_hash, v_new_hash, v_changed, v_old_snap, v_new_snap, p_source);

    UPDATE public.products
       SET social_hash   = v_new_hash,
           social_status = CASE
             WHEN v_current_status = 'published' THEN 'outdated'
             ELSE social_status
           END
     WHERE id = p_product_id;
  END IF;

  RETURN v_new_hash;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.compute_dedupe_key(text, uuid, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compute_product_social_hash(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_product_social_hash(uuid, text) TO authenticated, service_role;