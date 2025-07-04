
import { supabase } from '@/integrations/supabase/client';

export interface MigrationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VehicleValidationData {
  title: string;
  brand_id: string;
  subcategory_id: string;
  price_eur: number;
  registration_year: number;
  condition: 'new' | 'used' | 'restored' | 'modified';
  description: string;
  mileage_km?: number;
  operating_hours?: number;
  fuel_type?: string;
  gearbox?: string;
  power_ps?: number;
  drivetrain?: string;
  location?: string;
  main_image_url?: string;
}

// Validate vehicle data before insertion
export const validateVehicleData = async (data: VehicleValidationData): Promise<MigrationValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!data.title?.trim()) {
    errors.push('Title is required');
  }

  if (!data.brand_id) {
    errors.push('Brand ID is required');
  }

  if (!data.subcategory_id) {
    errors.push('Subcategory ID is required');
  }

  if (!data.price_eur || data.price_eur <= 0) {
    errors.push('Valid price is required');
  }

  if (!data.registration_year || data.registration_year < 1900 || data.registration_year > new Date().getFullYear() + 1) {
    errors.push('Valid registration year is required');
  }

  if (!data.description?.trim()) {
    errors.push('Description is required');
  }

  // Validate brand exists
  if (data.brand_id) {
    const { data: brand, error } = await supabase
      .from('vehicle_brands')
      .select('id')
      .eq('id', data.brand_id)
      .single();

    if (error || !brand) {
      errors.push(`Brand with ID ${data.brand_id} does not exist`);
    }
  }

  // Validate subcategory exists
  if (data.subcategory_id) {
    const { data: subcategory, error } = await supabase
      .from('subcategories')
      .select('id, category:categories(slug)')
      .eq('id', data.subcategory_id)
      .single();

    if (error || !subcategory) {
      errors.push(`Subcategory with ID ${data.subcategory_id} does not exist`);
    } else {
      // Category-specific validations
      const categorySlug = subcategory.category?.slug;
      
      if (categorySlug === 'trucks') {
        if (!data.mileage_km && data.operating_hours) {
          warnings.push('Trucks should use mileage_km instead of operating_hours');
        }
      } else if (categorySlug === 'machinery' || categorySlug === 'agriculture') {
        if (!data.operating_hours && data.mileage_km) {
          warnings.push('Machinery/Agriculture should use operating_hours instead of mileage_km');
        }
      }
    }
  }

  // Validate condition
  const validConditions = ['new', 'used', 'restored', 'modified'];
  if (!validConditions.includes(data.condition)) {
    errors.push('Invalid condition. Must be one of: new, used, restored, modified');
  }

  // Validate fuel type if provided
  if (data.fuel_type) {
    const validFuelTypes = ['diesel', 'electric', 'hybrid', 'petrol', 'gas'];
    if (!validFuelTypes.includes(data.fuel_type)) {
      warnings.push('Invalid fuel type. Should be one of: diesel, electric, hybrid, petrol, gas');
    }
  }

  // Validate gearbox if provided
  if (data.gearbox) {
    const validGearboxes = ['manual', 'automatic', 'semi-automatic'];
    if (!validGearboxes.includes(data.gearbox)) {
      warnings.push('Invalid gearbox. Should be one of: manual, automatic, semi-automatic');
    }
  }

  // Validate drivetrain if provided
  if (data.drivetrain) {
    const validDrivetrains = ['4x2', '4x4', '6x2', '6x4', '8x4', '8x6'];
    if (!validDrivetrains.includes(data.drivetrain)) {
      warnings.push('Invalid drivetrain. Should be one of: 4x2, 4x4, 6x2, 6x4, 8x4, 8x6');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Check database structure integrity
export const validateDatabaseStructure = async (): Promise<MigrationValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if all required tables exist with basic data
    const requiredTables = [
      'categories',
      'subcategories',
      'vehicle_brands',
      'vehicles',
      'vehicle_images',
      'featured_vehicles'
    ];

    for (const tableName of requiredTables) {
      const { error } = await supabase.from(tableName as any).select('id').limit(1);
      if (error) {
        errors.push(`Table ${tableName} is not accessible: ${error.message}`);
      }
    }

    // Check if basic data exists
    const { data: categories } = await supabase.from('categories').select('id').limit(1);
    if (!categories || categories.length === 0) {
      warnings.push('No categories found. Please add categories first.');
    }

    const { data: brands } = await supabase.from('vehicle_brands').select('id').limit(1);
    if (!brands || brands.length === 0) {
      warnings.push('No vehicle brands found. Please add brands first.');
    }

    const { data: subcategories } = await supabase.from('subcategories').select('id').limit(1);
    if (!subcategories || subcategories.length === 0) {
      warnings.push('No subcategories found. Please add subcategories first.');
    }

    // Check foreign key relationships
    const { data: vehiclesWithBrands } = await supabase
      .from('vehicles')
      .select('id, brand:vehicle_brands(id)')
      .limit(1);

    if (vehiclesWithBrands && vehiclesWithBrands.length > 0) {
      const vehicle = vehiclesWithBrands[0];
      if (!vehicle.brand) {
        warnings.push('Some vehicles may have invalid brand references');
      }
    }

  } catch (error) {
    errors.push(`Database validation failed: ${error}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Helper to get category mapping for field validation
export const getCategoryFieldMappings = () => {
  return {
    trucks: {
      primaryMetric: 'mileage_km',
      secondaryMetric: null,
      requiredFields: ['fuel_type', 'gearbox', 'drivetrain'],
      optionalFields: ['power_ps', 'axles', 'weight_kg']
    },
    machinery: {
      primaryMetric: 'operating_hours',
      secondaryMetric: null,
      requiredFields: ['power_ps'],
      optionalFields: ['weight_kg', 'fuel_type']
    },
    agriculture: {
      primaryMetric: 'operating_hours',
      secondaryMetric: null,
      requiredFields: ['power_ps'],
      optionalFields: ['weight_kg', 'fuel_type']
    }
  };
};

// Batch validation for multiple vehicles
export const validateVehiclesBatch = async (vehicles: VehicleValidationData[]): Promise<{
  validVehicles: VehicleValidationData[];
  invalidVehicles: Array<{ vehicle: VehicleValidationData; validation: MigrationValidationResult }>;
}> => {
  const validVehicles: VehicleValidationData[] = [];
  const invalidVehicles: Array<{ vehicle: VehicleValidationData; validation: MigrationValidationResult }> = [];

  for (const vehicle of vehicles) {
    const validation = await validateVehicleData(vehicle);
    if (validation.isValid) {
      validVehicles.push(vehicle);
    } else {
      invalidVehicles.push({ vehicle, validation });
    }
  }

  return { validVehicles, invalidVehicles };
};
