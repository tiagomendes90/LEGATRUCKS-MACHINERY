
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleBrand {
  id: string;
  name: string;
  slug: string;
  category?: string[];
  subcategories?: string[];
  created_at: string;
  updated_at: string;
}

export const useNewVehicleBrands = () => {
  return useQuery({
    queryKey: ['vehicle-brands'],
    queryFn: async () => {
      console.log('🔍 Fetching vehicle brands...');
      
      const { data, error } = await supabase
        .from('vehicle_brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error fetching vehicle brands:', error);
        throw error;
      }

      console.log('✅ Vehicle brands fetched successfully:');
      console.log(`📊 Total brands found: ${data?.length || 0}`);
      console.log('📋 Brand names:', data?.map(brand => brand.name) || []);
      console.log('🗂️ Full brand data:', data);
      
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
};

// Hook para buscar marcas filtradas por categoria
export const useVehicleBrandsByCategory = (category?: string) => {
  return useQuery({
    queryKey: ['vehicle-brands', 'by-category', category],
    queryFn: async () => {
      console.log(`🔍 Fetching brands for category: ${category || 'all'}`);
      
      const { data, error } = await supabase
        .from('vehicle_brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error fetching brands by category:', error);
        throw error;
      }

      console.log(`✅ All brands fetched: ${data?.length || 0}`);
      
      // If no category specified, return all brands
      if (!category) {
        console.log('📋 Returning all brands (no category filter)');
        return data || [];
      }

      // Filter brands that include the category in their category array
      const filteredBrands = data?.filter(brand => {
        const hasCategory = brand.category?.some(cat => 
          cat.toLowerCase() === category.toLowerCase()
        );
        console.log(`🔍 Brand "${brand.name}" has category "${category}":`, hasCategory);
        console.log(`📂 Brand categories:`, brand.category);
        return hasCategory;
      }) || [];

      console.log(`✅ Filtered brands for "${category}":`, filteredBrands.length);
      console.log('📋 Filtered brand names:', filteredBrands.map(b => b.name));
      
      return filteredBrands;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
};
