ALTER TABLE public.featured_products
ADD CONSTRAINT featured_products_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;