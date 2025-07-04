
-- Update the orders table to match the specification in Section 5.5
-- Add phone and message fields, and rename truck_id to vehicle_id

ALTER TABLE public.orders 
ADD COLUMN phone TEXT,
ADD COLUMN message TEXT;

-- Rename truck_id to vehicle_id to match the specification
ALTER TABLE public.orders 
RENAME COLUMN truck_id TO vehicle_id;

-- Update the foreign key constraint name to reflect the new column name
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_truck_id_fkey;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;

-- Rename customer_name to name to match specification
ALTER TABLE public.orders 
RENAME COLUMN customer_name TO name;

-- Update RLS policies to use the new column names
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Recreate RLS policies with updated logic
CREATE POLICY "Admins can manage all orders" 
  ON public.orders 
  FOR ALL 
  USING (is_admin());

CREATE POLICY "Anyone can create orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all orders" 
  ON public.orders 
  FOR SELECT 
  USING (is_admin());

CREATE POLICY "Admins can update orders" 
  ON public.orders 
  FOR UPDATE 
  USING (is_admin());
