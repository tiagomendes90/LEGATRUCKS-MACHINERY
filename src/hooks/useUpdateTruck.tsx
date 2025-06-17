
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UpdateTruckData {
  id: string;
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  condition?: string;
  category?: string;
  description?: string;
  location?: string;
  engine?: string;
  transmission?: string;
  features?: string[];
  images?: string[];
}

export const useUpdateTruck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (truckData: UpdateTruckData) => {
      const { id, ...updateData } = truckData;
      
      const { data, error } = await supabase
        .from('trucks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['featured-trucks'] });
    },
  });
};
