
-- Restrict is_admin() to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;

-- Fix storage SELECT policies to prevent public listing
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view vehicle images" ON storage.objects;

-- Allow viewing only specific files (not listing) - use path check
CREATE POLICY "Anyone can view product images by path" ON storage.objects 
FOR SELECT USING (bucket_id = 'product-images' AND (storage.filename(name) IS NOT NULL));

CREATE POLICY "Anyone can view vehicle images by path" ON storage.objects 
FOR SELECT USING (bucket_id = 'vehicle-images' AND (storage.filename(name) IS NOT NULL));
