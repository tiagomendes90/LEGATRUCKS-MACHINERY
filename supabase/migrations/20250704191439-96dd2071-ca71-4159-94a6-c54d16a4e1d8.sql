
-- Complete cleanup of old database structure
-- This will remove all old tables and their data

-- Drop old featured trucks table first (has foreign key)
DROP TABLE IF EXISTS public.featured_trucks CASCADE;

-- Drop old vehicle specifications table
DROP TABLE IF EXISTS public.vehicle_specifications CASCADE;

-- Drop the main old trucks table
DROP TABLE IF EXISTS public.trucks CASCADE;

-- Drop old brands table (replaced by vehicle_brands)
DROP TABLE IF EXISTS public.brands CASCADE;

-- Drop old filter options table if not being used
DROP TABLE IF EXISTS public.filter_options CASCADE;

-- Clean up any remaining old data in new tables that might have been imported incorrectly
-- This ensures vehicles table only has properly structured data
DELETE FROM public.vehicles WHERE created_at < '2024-07-04' AND description LIKE '%imported%';

-- Clean up any orphaned images or data
DELETE FROM public.vehicle_images WHERE vehicle_id NOT IN (SELECT id FROM public.vehicles);

-- Update any remaining references
UPDATE public.orders SET vehicle_id = NULL WHERE vehicle_id NOT IN (SELECT id FROM public.vehicles);
