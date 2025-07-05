
export const getDistanceField = (subcategorySlug: string) => {
  // Determine which distance field to show based on subcategory
  const truckSubcategories = ['tractor-unit', 'truck-over', 'light-trucks'];
  const machinerySubcategories = ['excavators', 'loaders', 'loaders-backhoe', 'dumpers', 'motor-grades', 'compactors', 'asphalt-equipment', 'cranes', 'forklift', 'teleunder'];
  
  if (truckSubcategories.includes(subcategorySlug)) {
    return {
      field: 'mileage_km' as const,
      label: 'Quilómetros (km)',
      placeholder: 'Ex: 150000'
    };
  } else if (machinerySubcategories.includes(subcategorySlug)) {
    return {
      field: 'operating_hours' as const,
      label: 'Horas de Funcionamento (h)',
      placeholder: 'Ex: 5000'
    };
  }
  
  return null;
};
