-- Allow profile creation for admin setup 
CREATE POLICY "Allow profile creation" ON public.profiles
FOR INSERT
WITH CHECK (true);