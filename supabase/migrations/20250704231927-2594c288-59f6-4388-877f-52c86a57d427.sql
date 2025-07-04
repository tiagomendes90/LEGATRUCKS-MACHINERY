
-- Fix the drivetrain check constraint to match the form options
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_drivetrain_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_drivetrain_check 
CHECK (drivetrain IS NULL OR drivetrain IN ('2wd', '4wd', 'awd'));

-- Increase the precision of numeric fields to handle larger values
ALTER TABLE vehicles ALTER COLUMN price_eur TYPE numeric(15,2);

-- Also update weight_kg to handle larger values if needed
ALTER TABLE vehicles ALTER COLUMN weight_kg TYPE bigint;
