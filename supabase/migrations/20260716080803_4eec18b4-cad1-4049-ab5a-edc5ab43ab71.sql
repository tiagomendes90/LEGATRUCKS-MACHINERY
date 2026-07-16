CREATE OR REPLACE FUNCTION public.diff_social_snapshots(old_s jsonb, new_s jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(k ORDER BY k), '[]'::jsonb)
  FROM (
    SELECT key AS k
    FROM jsonb_each(coalesce(new_s, '{}'::jsonb))
    WHERE coalesce(old_s -> key, 'null'::jsonb) IS DISTINCT FROM value
    UNION
    SELECT key
    FROM jsonb_each(coalesce(old_s, '{}'::jsonb))
    WHERE coalesce(new_s -> key, 'null'::jsonb) IS DISTINCT FROM value
  ) d;
$$;