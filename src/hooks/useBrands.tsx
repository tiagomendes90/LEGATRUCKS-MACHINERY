
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Brand {
  id: string;
  name: string;
  category: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export const useBrands = (category?: string) => {
  return useQuery({
    queryKey: ['brands', category],
    queryFn: async () => {
      console.log('Fetching brands with indexed query for category:', category);
      
      // Use indexed columns for better performance
      let query = supabase
        .from('brands')
        .select('*')
        .order('name'); // Uses idx_brands_name index
      
      if (category) {
        query = query.eq('category', category); // Uses idx_brands_category index
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching brands:', error);
        throw error;
      }

      console.log('Brands fetched successfully:', data?.length || 0, 'brands found');
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (brands change less frequently)
    gcTime: 1000 * 60 * 20, // Keep in cache for 20 minutes
    refetchOnWindowFocus: false,
  });
};
