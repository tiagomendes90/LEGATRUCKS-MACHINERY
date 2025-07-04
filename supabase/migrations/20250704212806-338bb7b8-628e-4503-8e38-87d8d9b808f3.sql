
-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-images', 'vehicle-images', true);

-- Create policy to allow anyone to view vehicle images
CREATE POLICY "Anyone can view vehicle images" ON storage.objects
FOR SELECT USING (bucket_id = 'vehicle-images');

-- Create policy to allow admins to upload vehicle images
CREATE POLICY "Admins can upload vehicle images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'vehicle-images' AND is_admin());

-- Create policy to allow admins to update vehicle images
CREATE POLICY "Admins can update vehicle images" ON storage.objects
FOR UPDATE USING (bucket_id = 'vehicle-images' AND is_admin());

-- Create policy to allow admins to delete vehicle images
CREATE POLICY "Admins can delete vehicle images" ON storage.objects
FOR DELETE USING (bucket_id = 'vehicle-images' AND is_admin());
