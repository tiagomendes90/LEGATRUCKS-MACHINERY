
-- Make buckets private to prevent listing bypass
UPDATE storage.buckets SET public = false WHERE id IN ('product-images', 'vehicle-images');
