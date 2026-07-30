-- 1. Lists
CREATE TABLE public.newsletter_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_lists TO authenticated;
GRANT ALL ON public.newsletter_lists TO service_role;
ALTER TABLE public.newsletter_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage newsletter_lists" ON public.newsletter_lists
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER update_newsletter_lists_updated_at
  BEFORE UPDATE ON public.newsletter_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. List membership
CREATE TABLE public.newsletter_list_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.newsletter_lists(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_id, subscriber_id)
);
CREATE INDEX idx_nls_list ON public.newsletter_list_subscribers(list_id);
CREATE INDEX idx_nls_subscriber ON public.newsletter_list_subscribers(subscriber_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_list_subscribers TO authenticated;
GRANT ALL ON public.newsletter_list_subscribers TO service_role;
ALTER TABLE public.newsletter_list_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage newsletter_list_subscribers" ON public.newsletter_list_subscribers
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 3. Subscriber tags
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

-- 4. Reusable templates
CREATE TABLE public.newsletter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  template_key text NOT NULL DEFAULT 'product_showcase_v1',
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  subject_template text,
  preheader_template text,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_templates TO authenticated;
GRANT ALL ON public.newsletter_templates TO service_role;
ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage newsletter_templates" ON public.newsletter_templates
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER update_newsletter_templates_updated_at
  BEFORE UPDATE ON public.newsletter_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Automations (scaffold, not executed yet)
CREATE TABLE public.newsletter_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'manual',
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  list_id uuid REFERENCES public.newsletter_lists(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.newsletter_templates(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_automations TO authenticated;
GRANT ALL ON public.newsletter_automations TO service_role;
ALTER TABLE public.newsletter_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage newsletter_automations" ON public.newsletter_automations
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER update_newsletter_automations_updated_at
  BEFORE UPDATE ON public.newsletter_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Campaign links
ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS list_id uuid REFERENCES public.newsletter_lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.newsletter_templates(id) ON DELETE SET NULL;

-- 7. Seed default list + template
INSERT INTO public.newsletter_lists (key, name, description, is_default)
VALUES ('geral', 'Lista Geral', 'Todos os subscritores ativos da newsletter LEGA.', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.newsletter_templates (key, name, description, is_default, content_json)
VALUES (
  'showcase_padrao',
  'Destaque de Produtos (padrão)',
  'Template base LEGA com introdução, cartões de produto e rodapé institucional.',
  true,
  '{"intro":"Confira as novidades mais recentes do nosso stock.","outro":"Precisa de mais informações? Responda a este email ou contacte-nos."}'::jsonb
)
ON CONFLICT (key) DO NOTHING;