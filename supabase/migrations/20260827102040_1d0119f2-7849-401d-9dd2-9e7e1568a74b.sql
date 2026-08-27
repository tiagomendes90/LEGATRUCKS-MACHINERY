ALTER TABLE public.product_translations
  ADD COLUMN IF NOT EXISTS fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_language text;

CREATE TABLE IF NOT EXISTS public.taxonomy_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('category','subcategory')),
  entity_id uuid NOT NULL,
  language_code text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, language_code)
);

GRANT SELECT ON public.taxonomy_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.taxonomy_translations TO authenticated;
GRANT ALL ON public.taxonomy_translations TO service_role;

ALTER TABLE public.taxonomy_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "taxonomy_translations_public_read"
  ON public.taxonomy_translations FOR SELECT
  USING (true);

CREATE POLICY "taxonomy_translations_admin_write"
  ON public.taxonomy_translations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_taxonomy_translations_updated_at
  BEFORE UPDATE ON public.taxonomy_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_taxonomy_translations_lookup
  ON public.taxonomy_translations (entity_type, entity_id, language_code);