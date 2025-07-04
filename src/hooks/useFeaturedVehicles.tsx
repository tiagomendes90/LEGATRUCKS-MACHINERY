
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface FeaturedVehicle {
  id: string;
  vehicle_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  vehicle: {
    id: string;
    title: string;
    price_eur: number;
    main_image_url?: string;
    registration_year: number;
    condition: string;
    brand?: { name: string; slug: string };
    subcategory?: { name: string; slug: string };
    images?: { image_url: string; sort_order: number }[];
  };
}

export const useFeaturedVehicles = () => {
  return useQuery({
    queryKey: ['featured-vehicles'],
    queryFn: async () => {
      console.log('Fetching featured vehicles...');
      
      const { data, error } = await supabase
        .from('featured_vehicles')
        .select(`
          *,
          vehicle:vehicles(
            id,
            title,
            price_eur,
            main_image_url,
            registration_year,
            condition,
            brand:vehicle_brands(name, slug),
            subcategory:subcategories(name, slug),
            images:vehicle_images(image_url, sort_order)
          )
        `)
        .eq('vehicle.is_active', true)
        .eq('vehicle.is_published', true)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching featured vehicles:', error);
        throw error;
      }

      console.log('Featured vehicles fetched:', data?.length || 0);
      return data || [];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useAddFeaturedVehicle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ vehicle_id, position }: { vehicle_id: string; position: number }) => {
      if (!user || !isAdmin) {
        throw new Error('Admin access required');
      }

      const { data, error } = await supabase
        .from('featured_vehicles')
        .insert([{ vehicle_id, position }])
        .select()
        .single();

      if (error) {
        console.error('Error adding featured vehicle:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle added to featured list!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to add featured vehicle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add featured vehicle.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFeaturedVehiclePosition = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ id, position }: { id: string; position: number }) => {
      if (!user || !isAdmin) {
        throw new Error('Admin access required');
      }

      const { data, error } = await supabase
        .from('featured_vehicles')
        .update({ position })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating featured vehicle position:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-vehicles'] });
      toast({
        title: "Success",
        description: "Featured vehicle position updated!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to update featured vehicle position:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update position.",
        variant: "destructive",
      });
    },
  });
};

export const useRemoveFeaturedVehicle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || !isAdmin) {
        throw new Error('Admin access required');
      }

      const { error } = await supabase
        .from('featured_vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing featured vehicle:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle removed from featured list!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to remove featured vehicle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove featured vehicle.",
        variant: "destructive",
      });
    },
  });
};
