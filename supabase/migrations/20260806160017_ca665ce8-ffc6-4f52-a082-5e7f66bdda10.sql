ALTER TABLE public.publishing_events REPLICA IDENTITY FULL;
ALTER TABLE public.product_social_posts REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.publishing_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_social_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;