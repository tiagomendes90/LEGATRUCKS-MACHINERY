CREATE TABLE public.creative_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'story',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creative_templates_kind_check CHECK (kind IN ('story','reel_cover'))
);

GRANT SELECT ON public.creative_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creative_templates TO authenticated;
GRANT ALL ON public.creative_templates TO service_role;

ALTER TABLE public.creative_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creative_templates_public_read_active"
  ON public.creative_templates FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "creative_templates_admin_write"
  ON public.creative_templates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_creative_templates_updated_at
  BEFORE UPDATE ON public.creative_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.product_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.creative_templates(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'story',
  label text,
  image_url text,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_creatives_kind_check CHECK (kind IN ('story','reel_cover'))
);

CREATE INDEX idx_product_creatives_product ON public.product_creatives(product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_creatives TO authenticated;
GRANT ALL ON public.product_creatives TO service_role;

ALTER TABLE public.product_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_creatives_admin_all"
  ON public.product_creatives FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_product_creatives_updated_at
  BEFORE UPDATE ON public.product_creatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.creative_templates (name, kind, description, is_active, is_default, sort_order, config) VALUES
('Editorial Escuro', 'story', 'Fotografia em destaque com painel institucional inferior.', true, true, 1,
 '{"layout":"editorial","background":"#081B33","surface":"#0B2545","accent":"#F39200","text":"#FFFFFF","muted":"#C7D3E3","overlay":0.55,"photoFrame":"full","accentBar":true,"blocks":{"logo":true,"brand":true,"model":true,"price":true,"year":true,"usage":true,"location":true,"qr":true,"website":true,"cta":true},"cta":"Disponível agora","website":"www.lega.pt"}'::jsonb),
('Split Diagonal', 'story', 'Corte diagonal entre fotografia e bloco de dados.', true, false, 2,
 '{"layout":"diagonal","background":"#0B2545","surface":"#081B33","accent":"#F39200","text":"#FFFFFF","muted":"#C7D3E3","overlay":0.35,"photoFrame":"top","accentBar":true,"blocks":{"logo":true,"brand":true,"model":true,"price":true,"year":true,"usage":true,"location":true,"qr":true,"website":true,"cta":true},"cta":"Saiba mais em lega.pt","website":"www.lega.pt"}'::jsonb),
('Minimal Claro', 'story', 'Fundo claro, tipografia limpa, ideal para novidades.', true, false, 3,
 '{"layout":"minimal","background":"#F3F4F6","surface":"#FFFFFF","accent":"#0B2545","text":"#0B2545","muted":"#5B6B80","overlay":0.15,"photoFrame":"card","accentBar":false,"blocks":{"logo":true,"brand":true,"model":true,"price":true,"year":true,"usage":true,"location":true,"qr":true,"website":true,"cta":true},"cta":"Consulte disponibilidade","website":"www.lega.pt"}'::jsonb),
('Etiqueta de Promoção', 'story', 'Faixa de destaque para campanhas e promoções.', true, false, 4,
 '{"layout":"promo","background":"#081B33","surface":"#F39200","accent":"#F39200","text":"#FFFFFF","muted":"#FFE3BC","overlay":0.5,"photoFrame":"full","accentBar":true,"ribbon":"OPORTUNIDADE","blocks":{"logo":true,"brand":true,"model":true,"price":true,"year":true,"usage":true,"location":true,"qr":true,"website":true,"cta":true},"cta":"Oferta limitada","website":"www.lega.pt"}'::jsonb),
('Capa Reel Escura', 'reel_cover', 'Capa vertical de alto contraste para Reels.', true, true, 1,
 '{"layout":"editorial","background":"#081B33","surface":"#0B2545","accent":"#F39200","text":"#FFFFFF","muted":"#C7D3E3","overlay":0.6,"photoFrame":"full","accentBar":true,"blocks":{"logo":true,"brand":true,"model":true,"price":false,"year":true,"usage":true,"location":false,"qr":false,"website":true,"cta":true},"cta":"Vê o vídeo completo","website":"www.lega.pt"}'::jsonb);