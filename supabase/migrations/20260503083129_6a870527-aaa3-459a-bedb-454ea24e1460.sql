
-- Fix is_admin() with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- Enable RLS on ALL tables
-- ============================================
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop any existing policies to avoid conflicts
-- ============================================
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================
-- PUBLIC CATALOG TABLES: public read, admin write
-- ============================================

-- brands
CREATE POLICY "Public can read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- categories
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- subcategories
CREATE POLICY "Public can read subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Admins can manage subcategories" ON public.subcategories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- category_brands
CREATE POLICY "Public can read category_brands" ON public.category_brands FOR SELECT USING (true);
CREATE POLICY "Admins can manage category_brands" ON public.category_brands FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- products
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- product_images
CREATE POLICY "Public can read product_images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage product_images" ON public.product_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- featured_products
CREATE POLICY "Public can read featured_products" ON public.featured_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage featured_products" ON public.featured_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- spec_definitions
CREATE POLICY "Public can read spec_definitions" ON public.spec_definitions FOR SELECT USING (true);
CREATE POLICY "Admins can manage spec_definitions" ON public.spec_definitions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- spec_values
CREATE POLICY "Public can read spec_values" ON public.spec_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage spec_values" ON public.spec_values FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- PROFILES: restricted access
-- ============================================
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile no role change" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- ORDERS: public insert, admin manage
-- ============================================
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- STORAGE: tighten upload policies to admin only
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vehicle images" ON storage.objects;

-- Public read for both buckets
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public can view vehicle images" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-images');

-- Admin-only write for both buckets
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admins can upload vehicle images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-images' AND public.is_admin());
CREATE POLICY "Admins can update vehicle images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'vehicle-images' AND public.is_admin());
CREATE POLICY "Admins can delete vehicle images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-images' AND public.is_admin());
