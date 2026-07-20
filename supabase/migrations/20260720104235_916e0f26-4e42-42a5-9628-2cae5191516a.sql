-- 1) Editable caption per product (used by admin before confirming social publish)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS social_caption text;

-- 2) Auto-transition not_ready -> ready_for_social when product becomes active
CREATE OR REPLACE FUNCTION public.trg_products_auto_ready_for_social()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true
     AND coalesce(NEW.social_status, 'not_ready') = 'not_ready' THEN
    NEW.social_status := 'ready_for_social';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_auto_ready_for_social ON public.products;
CREATE TRIGGER trg_products_auto_ready_for_social
  BEFORE INSERT OR UPDATE OF is_active ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.trg_products_auto_ready_for_social();

-- 3) Backfill: active products still stuck in 'not_ready'
UPDATE public.products
   SET social_status = 'ready_for_social'
 WHERE is_active = true
   AND social_status = 'not_ready';