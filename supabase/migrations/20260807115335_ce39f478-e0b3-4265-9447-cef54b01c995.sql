-- ============ 1. Idiomas da Newsletter (genérico, extensível) ============
CREATE TABLE IF NOT EXISTS public.newsletter_languages (
  code text PRIMARY KEY,
  label text NOT NULL,
  native_label text NOT NULL,
  flag_emoji text,
  locale text,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  fallback_code text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.newsletter_languages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_languages TO authenticated;
GRANT ALL ON public.newsletter_languages TO service_role;

ALTER TABLE public.newsletter_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Newsletter languages are publicly readable"
  ON public.newsletter_languages FOR SELECT USING (true);
CREATE POLICY "Admins manage newsletter languages"
  ON public.newsletter_languages FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_newsletter_languages_updated
  BEFORE UPDATE ON public.newsletter_languages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apenas um idioma por defeito
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_languages_single_default
  ON public.newsletter_languages ((is_default)) WHERE is_default;

INSERT INTO public.newsletter_languages (code, label, native_label, flag_emoji, locale, is_default, fallback_code, sort_order)
VALUES
  ('en', 'English',    'English',    '🇬🇧', 'en-GB', true,  NULL, 1),
  ('pt', 'Portuguese', 'Português',  '🇵🇹', 'pt-PT', false, 'en', 2),
  ('fr', 'French',     'Français',   '🇫🇷', 'fr-FR', false, 'en', 3)
ON CONFLICT (code) DO NOTHING;

-- ============ 2. Textos institucionais editáveis por idioma ============
CREATE TABLE IF NOT EXISTS public.newsletter_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text NOT NULL REFERENCES public.newsletter_languages(code) ON DELETE CASCADE,
  key text NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (language_code, key)
);

GRANT SELECT ON public.newsletter_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_translations TO authenticated;
GRANT ALL ON public.newsletter_translations TO service_role;

ALTER TABLE public.newsletter_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Newsletter translations are publicly readable"
  ON public.newsletter_translations FOR SELECT USING (true);
CREATE POLICY "Admins manage newsletter translations"
  ON public.newsletter_translations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_newsletter_translations_updated
  BEFORE UPDATE ON public.newsletter_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. Preferência de idioma do subscritor ============
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS language_locked boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS newsletter_subscribers_language_idx
  ON public.newsletter_subscribers (preferred_language);

-- ============ 4. Numeração pública + traduções de campanha ============
CREATE SEQUENCE IF NOT EXISTS public.newsletter_campaign_number_seq;

ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS public_number bigint,
  ADD COLUMN IF NOT EXISTS default_language text NOT NULL DEFAULT 'en';

UPDATE public.newsletter_campaigns c
   SET public_number = s.rn
  FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn
          FROM public.newsletter_campaigns) s
 WHERE s.id = c.id AND c.public_number IS NULL;

SELECT setval(
  'public.newsletter_campaign_number_seq',
  GREATEST(COALESCE((SELECT max(public_number) FROM public.newsletter_campaigns), 0), 1)
);

ALTER TABLE public.newsletter_campaigns
  ALTER COLUMN public_number SET DEFAULT nextval('public.newsletter_campaign_number_seq');

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_campaigns_public_number_idx
  ON public.newsletter_campaigns (public_number);

CREATE TABLE IF NOT EXISTS public.newsletter_campaign_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  language_code text NOT NULL REFERENCES public.newsletter_languages(code) ON DELETE CASCADE,
  subject text,
  preheader text,
  title text,
  intro text,
  outro text,
  cta_label text,
  footer_note text,
  is_auto_translated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, language_code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_campaign_translations TO authenticated;
GRANT ALL ON public.newsletter_campaign_translations TO service_role;

ALTER TABLE public.newsletter_campaign_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaign translations"
  ON public.newsletter_campaign_translations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_newsletter_campaign_translations_updated
  BEFORE UPDATE ON public.newsletter_campaign_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 5. Traduções de conteúdo de produto ============
CREATE TABLE IF NOT EXISTS public.product_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  title text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, language_code)
);

GRANT SELECT ON public.product_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_translations TO authenticated;
GRANT ALL ON public.product_translations TO service_role;

ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product translations are publicly readable"
  ON public.product_translations FOR SELECT USING (true);
CREATE POLICY "Admins manage product translations"
  ON public.product_translations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_product_translations_updated
  BEFORE UPDATE ON public.product_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 6. Idioma nos registos de envio ============
ALTER TABLE public.newsletter_sends
  ADD COLUMN IF NOT EXISTS language_code text;