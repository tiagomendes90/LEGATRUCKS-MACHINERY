ALTER TABLE public.product_social_posts DROP CONSTRAINT IF EXISTS product_social_posts_status_check;
ALTER TABLE public.product_social_posts ADD CONSTRAINT product_social_posts_status_check
  CHECK (status = ANY (ARRAY['published'::text,'live'::text,'deleted'::text,'removed'::text,'failed'::text,'pending'::text]));
ALTER TABLE public.product_social_posts ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE public.product_social_posts ADD COLUMN IF NOT EXISTS verification_error text;
CREATE INDEX IF NOT EXISTS idx_social_posts_verify ON public.product_social_posts (status, last_verified_at);