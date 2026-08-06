GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_social_posts TO authenticated;
GRANT ALL ON public.product_social_posts TO service_role;
GRANT SELECT ON public.publishing_logs TO authenticated;
GRANT ALL ON public.publishing_logs TO service_role;