
-- Create vehicle_brands table
CREATE TABLE public.vehicle_brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text[] DEFAULT '{}',
  subcategories text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  brand_id uuid REFERENCES public.vehicle_brands(id),
  subcategory_id uuid REFERENCES public.subcategories(id),
  condition text DEFAULT 'used',
  registration_year integer,
  mileage_km integer,
  operating_hours integer,
  price_eur numeric DEFAULT 0,
  fuel_type text,
  gearbox text,
  power_ps integer,
  drivetrain text,
  axles integer,
  weight_kg numeric,
  body_color text,
  main_image_url text,
  location text,
  contact_info text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create vehicle_images table
CREATE TABLE public.vehicle_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create featured_vehicles table
CREATE TABLE public.featured_vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
