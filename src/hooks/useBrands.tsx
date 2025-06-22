
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
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes (increased from 10)
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour (increased from 20 minutes)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchInterval: 1000 * 60 * 45, // Background refetch every 45 minutes
  });
};
