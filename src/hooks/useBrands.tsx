
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
      console.log('Fetching brands from database for category:', category);
      
      let query = supabase.from('brands').select('*').order('name');
      
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching brands:', error);
        throw error;
      }

      console.log('Brands fetched successfully:', data?.length || 0, 'brands found');
      return data || [];
    },
  });
};
