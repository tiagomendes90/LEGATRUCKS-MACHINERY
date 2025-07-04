
-- Create categories table (simple with just 3 fixed categories)
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the 3 main categories
INSERT INTO public.categories (name, slug) VALUES 
  ('Trucks', 'trucks'),
  ('Machinery', 'machinery'),
  ('Agriculture', 'agriculture');

-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slug, category_id)
);

-- Insert subcategories for trucks
INSERT INTO public.subcategories (name, slug, category_id) 
SELECT 'Tractor Unit', 'tractor-unit', id FROM public.categories WHERE slug = 'trucks'
UNION ALL
SELECT 'Truck Over', 'truck-over', id FROM public.categories WHERE slug = 'trucks'
UNION ALL
SELECT 'Light Trucks', 'light-trucks', id FROM public.categories WHERE slug = 'trucks';

-- Insert subcategories for machinery
INSERT INTO public.subcategories (name, slug, category_id) 
SELECT 'Excavators', 'excavators', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Loaders', 'loaders', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Loaders Backhoe', 'loaders-backhoe', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Dumpers', 'dumpers', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Motor Grades', 'motor-grades', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Compactors', 'compactors', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Asphalt Equipment', 'asphalt-equipment', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Cranes', 'cranes', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Forklift', 'forklift', id FROM public.categories WHERE slug = 'machinery'
UNION ALL
SELECT 'Telehandler', 'telehandler', id FROM public.categories WHERE slug = 'machinery';

-- Insert subcategories for agriculture
INSERT INTO public.subcategories (name, slug, category_id) 
SELECT 'Tractors', 'tractors', id FROM public.categories WHERE slug = 'agriculture'
UNION ALL
SELECT 'Harvesters', 'harvesters', id FROM public.categories WHERE slug = 'agriculture'
UNION ALL
SELECT 'Implements', 'implements', id FROM public.categories WHERE slug = 'agriculture';

-- Create brands table (normalized)
CREATE TABLE public.vehicle_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create main vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  brand_id UUID NOT NULL REFERENCES public.vehicle_brands(id) ON DELETE RESTRICT,
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE RESTRICT,
  condition TEXT NOT NULL DEFAULT 'used' CHECK (condition IN ('new', 'used', 'restored', 'modified')),
  registration_year INTEGER NOT NULL,
  mileage_km INTEGER,
  operating_hours INTEGER,
  price_eur NUMERIC(12,2) NOT NULL,
  fuel_type TEXT CHECK (fuel_type IN ('diesel', 'electric', 'hybrid', 'petrol', 'gas')),
  gearbox TEXT CHECK (gearbox IN ('manual', 'automatic', 'semi-automatic')),
  power_ps INTEGER,
  drivetrain TEXT CHECK (drivetrain IN ('4x2', '4x4', '6x2', '6x4', '8x4', '8x6')),
  axles INTEGER,
  weight_kg INTEGER,
  body_color TEXT,
  main_image_url TEXT,
  location TEXT,
  contact_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicle_images table for additional images
CREATE TABLE public.vehicle_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create featured_vehicles table
CREATE TABLE public.featured_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_vehicles_brand_id ON public.vehicles(brand_id);
CREATE INDEX idx_vehicles_subcategory_id ON public.vehicles(subcategory_id);
CREATE INDEX idx_vehicles_condition ON public.vehicles(condition);
CREATE INDEX idx_vehicles_registration_year ON public.vehicles(registration_year);
CREATE INDEX idx_vehicles_price_eur ON public.vehicles(price_eur);
CREATE INDEX idx_vehicles_is_active ON public.vehicles(is_active);
CREATE INDEX idx_vehicles_is_published ON public.vehicles(is_published);
CREATE INDEX idx_vehicles_is_featured ON public.vehicles(is_featured);
CREATE INDEX idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Everyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Everyone can view subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Everyone can view vehicle brands" ON public.vehicle_brands FOR SELECT USING (true);
CREATE POLICY "Everyone can view published vehicles" ON public.vehicles FOR SELECT USING (is_published = true AND is_active = true);
CREATE POLICY "Everyone can view vehicle images" ON public.vehicle_images FOR SELECT USING (true);
CREATE POLICY "Everyone can view featured vehicles" ON public.featured_vehicles FOR SELECT USING (true);

-- Create RLS policies for admin management
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage subcategories" ON public.subcategories FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage vehicle brands" ON public.vehicle_brands FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage vehicles" ON public.vehicles FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage vehicle images" ON public.vehicle_images FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage featured vehicles" ON public.featured_vehicles FOR ALL USING (is_admin());

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vehicle_brands_updated_at BEFORE UPDATE ON public.vehicle_brands FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_featured_vehicles_updated_at BEFORE UPDATE ON public.featured_vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
