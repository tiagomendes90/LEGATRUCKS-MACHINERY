
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
      
      let query = supabase
        .from('vehicle_brands')
        .select('*')
        .order('name');

      // Se categoria especificada e as colunas existirem, filtrar marcas que incluem essa categoria
      if (category) {
        // Usar uma query mais segura que funciona mesmo se as colunas não existirem
        query = query.or(`category.cs.{${category}},name.ilike.%${category}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching brands by category:', error);
        // Se houver erro com as colunas category, fazer fallback para buscar todas as marcas
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('vehicle_brands')
          .select('id, name, slug, created_at, updated_at')
          .order('name');
        
        if (fallbackError) {
          throw fallbackError;
        }
        
        console.log(`✅ Fallback brands fetched:`, fallbackData?.length || 0);
        return fallbackData || [];
      }

      console.log(`✅ Brands for category "${category || 'all'}" fetched:`, data?.length || 0);
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
};
