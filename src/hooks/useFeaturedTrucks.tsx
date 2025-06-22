import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FeaturedTruck {
  id: string;
  truck_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  trucks: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    category: string;
    subcategory: string;
    images: string[];
    features: string[];
  };
}

export const useFeaturedTrucks = () => {
  return useQuery({
    queryKey: ['featured-trucks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_trucks')
        .select(`
          id,
          truck_id,
          position,
          created_at,
          updated_at,
          trucks (
            id,
            brand,
            model,
            year,
            price,
            category,
            images,
            features
          )
        `)
        .order('position', { ascending: true })
        .limit(6); // Limit featured trucks to improve performance

      if (error) throw error;
      return data as FeaturedTruck[];
    },
    staleTime: 1000 * 60 * 20, // Cache for 20 minutes
    gcTime: 1000 * 60 * 40, // Keep in cache for 40 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchInterval: 1000 * 60 * 30, // Background refetch every 30 minutes
  });
};

export const useAddFeaturedTruck = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ truck_id, position }: { truck_id: string; position: number }) => {
      const { data, error } = await supabase
        .from('featured_trucks')
        .insert([{ truck_id, position }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-trucks'] });
      toast({
        title: "Featured Truck Added",
        description: "Truck has been added to featured section successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add featured truck: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveFeaturedTruck = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (featuredTruckId: string) => {
      const { error } = await supabase
        .from('featured_trucks')
        .delete()
        .eq('id', featuredTruckId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-trucks'] });
      toast({
        title: "Featured Truck Removed",
        description: "Truck has been removed from featured section.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to remove featured truck: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
