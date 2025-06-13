
-- Update the check constraint to allow positions 1-6 instead of 1-3
ALTER TABLE featured_trucks 
DROP CONSTRAINT IF EXISTS featured_trucks_position_check;

ALTER TABLE featured_trucks 
ADD CONSTRAINT featured_trucks_position_check 
CHECK (position >= 1 AND position <= 6);
