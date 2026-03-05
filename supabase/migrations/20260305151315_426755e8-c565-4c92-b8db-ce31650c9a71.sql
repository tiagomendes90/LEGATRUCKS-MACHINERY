
-- Allow authenticated users to upload to vehicle-images bucket
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

-- Allow authenticated users to update vehicle images
CREATE POLICY "Authenticated users can update vehicle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images');

-- Allow authenticated users to delete vehicle images
CREATE POLICY "Authenticated users can delete vehicle images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');

-- Allow public read access to vehicle images
CREATE POLICY "Public read access for vehicle images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

-- Same policies for product-images bucket
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
