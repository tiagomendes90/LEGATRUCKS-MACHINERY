-- ============================================================
-- Fase 2.2 — Sitemap dinâmico, canal search-engines,
-- auditoria de social_hash com serialização determinística.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tabela de auditoria do social_hash
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_social_hash_audit (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_hash       text,
  new_hash       text NOT NULL,
  changed_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  old_snapshot   jsonb,
  new_snapshot   jsonb NOT NULL,
  source         text NOT NULL DEFAULT 'unknown',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_social_hash_audit_product
  ON public.product_social_hash_audit (product_id, created_at DESC);

GRANT SELECT ON public.product_social_hash_audit TO authenticated;
GRANT ALL    ON public.product_social_hash_audit TO service_role;

ALTER TABLE public.product_social_hash_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view social hash audit"
  ON public.product_social_hash_audit;
CREATE POLICY "Admins can view social hash audit"
  ON public.product_social_hash_audit
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 2) Serialização determinística do "snapshot" do produto
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.build_product_social_snapshot(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  SELECT jsonb_build_object(
    'title',         lower(btrim(regexp_replace(coalesce(p.title, ''),        '\s+', ' ', 'g'))),
    'description',   lower(btrim(regexp_replace(coalesce(p.description, ''),  '\s+', ' ', 'g'))),
    'price',         coalesce(p.price::text, ''),
    'currency',      upper(coalesce(p.currency, '')),
    'brand',         lower(coalesce(b.slug, '')),
    'category',      lower(coalesce(c.slug, '')),
    'subcategory',   lower(coalesce(sc.slug, '')),
    'year',          coalesce(p.year::text, ''),
    'condition',     lower(coalesce(p.condition, '')),
    'model',         lower(btrim(coalesce(p.model, ''))),
    'stock_status',  lower(coalesce(p.stock_status, '')),
    'location',      lower(btrim(coalesce(p.location_country, '') || '|' || coalesce(p.location_city, ''))),
    'is_active',     coalesce(p.is_active, false),
    'images',        coalesce((
      SELECT jsonb_agg(
               jsonb_build_object(
                 'url',        btrim(pi.image_url),
                 'is_primary', coalesce(pi.is_primary, false),
                 'sort_order', coalesce(pi.sort_order, 0)
               )
               ORDER BY coalesce(pi.sort_order, 0), pi.image_url
             )
      FROM public.product_images pi
      WHERE pi.product_id = p.id
    ), '[]'::jsonb),
    'specs',         coalesce((
      SELECT jsonb_agg(
               jsonb_build_object(
                 'name',   sd.name,
                 'text',   sv.value_text,
                 'number', sv.value_number,
                 'bool',   sv.value_boolean
               )
               ORDER BY sd.name
             )
      FROM public.spec_values sv
      JOIN public.spec_definitions sd ON sd.id = sv.spec_definition_id
      WHERE sv.product_id = p.id
    ), '[]'::jsonb)
  )
  INTO v
  FROM public.products p
  LEFT JOIN public.brands        b  ON b.id  = p.brand_id
  LEFT JOIN public.subcategories sc ON sc.id = p.subcategory_id
  LEFT JOIN public.categories    c  ON c.id  = coalesce(p.category_id, sc.category_id)
  WHERE p.id = p_product_id;

  RETURN v;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.build_product_social_snapshot(uuid) FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 3) Hash SHA256 canónico do snapshot
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_product_social_hash(p_product_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT encode(
    extensions.digest(
      (public.build_product_social_snapshot(p_product_id))::text::bytea,
      'sha256'
    ),
    'hex'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.compute_product_social_hash(uuid) FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 4) Detecção dos campos alterados entre dois snapshots
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.diff_social_snapshots(old_s jsonb, new_s jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
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

-- ------------------------------------------------------------
-- 5) Refresh + auditoria + marcação outdated
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_product_social_hash(
  p_product_id uuid,
  p_source     text DEFAULT 'unknown'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    extensions.digest(v_new_snap::text::bytea, 'sha256'),
    'hex'
  );

  IF v_new_hash IS DISTINCT FROM v_old_hash THEN
    -- Reconstroi o snapshot antigo a partir da última entrada de auditoria
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
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_product_social_hash(uuid, text) FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 6) Triggers em products e product_images
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_refresh_social_hash_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_product_social_hash(NEW.id, 'products.update');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trg_refresh_social_hash_products() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_products_refresh_social_hash ON public.products;
CREATE TRIGGER trg_products_refresh_social_hash
  AFTER INSERT OR UPDATE OF
    title, description, price, currency, brand_id, category_id, subcategory_id,
    year, condition, model, location_country, location_city, stock_status, is_active
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_social_hash_products();

CREATE OR REPLACE FUNCTION public.trg_refresh_social_hash_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pid uuid;
BEGIN
  v_pid := COALESCE(NEW.product_id, OLD.product_id);
  IF v_pid IS NOT NULL THEN
    PERFORM public.refresh_product_social_hash(v_pid, 'product_images.change');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trg_refresh_social_hash_images() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_product_images_refresh_social_hash ON public.product_images;
CREATE TRIGGER trg_product_images_refresh_social_hash
  AFTER INSERT OR UPDATE OR DELETE
  ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_social_hash_images();

-- ------------------------------------------------------------
-- 7) Regista o canal search-engines (desligado por defeito)
-- ------------------------------------------------------------
INSERT INTO public.publishing_channels (key, label, enabled, config)
VALUES ('search-engines', 'Motores de Pesquisa', false, '{"engines": ["indexnow"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- 8) Backfill inicial do social_hash para produtos existentes
-- ------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.products LOOP
    PERFORM public.refresh_product_social_hash(r.id, 'backfill');
  END LOOP;
END $$;