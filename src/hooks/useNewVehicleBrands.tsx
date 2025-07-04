
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleBrand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export const useNewVehicleBrands = () => {
  return useQuery({
    queryKey: ['vehicle-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching vehicle brands:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
};
