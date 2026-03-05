
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleBrand {
  id: string;
  name: string;
  slug: string;
}

export const useNewVehicleBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      console.log('🔍 Fetching brands...');
      
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error fetching brands:', error);
        throw error;
      }

      console.log(`✅ Brands fetched: ${data?.length || 0}`);
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
};

// Hook para buscar marcas filtradas por categoria
export const useVehicleBrandsByCategory = (categorySlug?: string) => {
  return useQuery({
    queryKey: ['brands', 'by-category', categorySlug],
    queryFn: async () => {
      if (!categorySlug) {
        const { data, error } = await supabase.from('brands').select('*').order('name');
        if (error) throw error;
        return data || [];
      }

      // Get category id
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (!cat) return [];

      // Get brand ids for this category
      const { data: cb, error } = await supabase
        .from('category_brands')
        .select('brand_id, brand:brands(*)')
        .eq('category_id', cat.id);

      if (error) throw error;

      const brands = (cb || []).map((item: any) => item.brand).filter(Boolean);
      return brands;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
};
