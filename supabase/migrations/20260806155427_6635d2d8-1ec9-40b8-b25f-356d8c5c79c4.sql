ALTER TABLE public.product_social_posts DROP CONSTRAINT product_social_posts_status_check;
ALTER TABLE public.product_social_posts ADD CONSTRAINT product_social_posts_status_check CHECK (status = ANY (ARRAY['published'::text, 'live'::text, 'deleted'::text, 'failed'::text, 'pending'::text]));
ALTER TABLE public.product_social_posts ALTER COLUMN status SET DEFAULT 'published'::text;