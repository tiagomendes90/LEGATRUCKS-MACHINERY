-- 1. Deduplicate subcategories: keep the one with most spec_definitions per (category_id, slug)
DO $$
DECLARE
  r record;
  canonical uuid;
  dup_id uuid;
BEGIN
  FOR r IN
    SELECT category_id, slug
    FROM public.subcategories
    GROUP BY category_id, slug
    HAVING count(*) > 1
  LOOP
    SELECT sc.id INTO canonical
    FROM public.subcategories sc
    LEFT JOIN public.spec_definitions sd ON sd.subcategory_id = sc.id
    WHERE sc.category_id = r.category_id AND sc.slug = r.slug
    GROUP BY sc.id, sc.created_at
    ORDER BY count(sd.id) DESC, sc.created_at ASC NULLS LAST, sc.id ASC
    LIMIT 1;

    FOR dup_id IN
      SELECT id FROM public.subcategories
      WHERE category_id = r.category_id AND slug = r.slug AND id <> canonical
    LOOP
      UPDATE public.products        SET subcategory_id = canonical WHERE subcategory_id = dup_id;
      UPDATE public.spec_definitions SET subcategory_id = canonical WHERE subcategory_id = dup_id;
      DELETE FROM public.subcategories WHERE id = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- 2. Prevent recurrence
ALTER TABLE public.subcategories
  ADD CONSTRAINT subcategories_category_slug_uniq UNIQUE (category_id, slug);

-- 3. New subcategory: Empilhador Telescópico (in Máquinas)
INSERT INTO public.subcategories (name, slug, category_id)
SELECT 'Empilhador Telescópico', 'empilhador-telescopico', id
FROM public.categories WHERE slug = 'maquinas'
ON CONFLICT (category_id, slug) DO NOTHING;

-- 4. New brand: Manitou
INSERT INTO public.brands (name, slug)
VALUES ('Manitou', 'manitou')
ON CONFLICT (slug) DO NOTHING;

-- 5. Associate Manitou to Máquinas
INSERT INTO public.category_brands (category_id, brand_id)
SELECT c.id, b.id
FROM public.categories c, public.brands b
WHERE c.slug = 'maquinas' AND b.slug = 'manitou'
ON CONFLICT DO NOTHING;

-- 6. Reinforce referential integrity — block deletion when products exist
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE public.products
  ADD CONSTRAINT products_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey;
ALTER TABLE public.products
  ADD CONSTRAINT products_subcategory_id_fkey
  FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE RESTRICT;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_brand_id_fkey;
ALTER TABLE public.products
  ADD CONSTRAINT products_brand_id_fkey
  FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE RESTRICT;