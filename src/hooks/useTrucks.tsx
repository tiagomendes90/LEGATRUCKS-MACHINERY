
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Truck {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage?: number;
  price: number;
  condition: string;
  engine: string;
  transmission: string;
  description: string;
  horsepower?: number;
  category?: string;
  subcategory?: string;
  features?: string[];
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export const useTrucks = (category?: string, limit = 12) => {
  return useQuery({
    queryKey: ['trucks', category, limit],
    queryFn: async () => {
      console.log('Fetching trucks with category filter:', category, 'limit:', limit);
      
      let query = supabase
        .from('trucks')
        .select('id, brand, model, year, mileage, price, condition, engine, transmission, description, category, subcategory, features, images, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Only apply category filter if category is provided and not undefined
      if (category && category !== 'undefined') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching trucks:', error);
        throw error;
      }

      console.log('Trucks fetched successfully:', data?.length || 0, 'trucks found');
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (increased)
    gcTime: 1000 * 60 * 20, // Keep in cache for 20 minutes (increased)
    refetchOnWindowFocus: false,
    retry: 1, // Reduced retry attempts
    retryDelay: 2000, // Fixed retry delay
  });
};

export const useAddTruck = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (truck: Omit<Truck, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('Adding truck with user:', user?.id, 'isAdmin:', isAdmin);
      
      if (!user) {
        throw new Error('User must be authenticated to add trucks');
      }

      if (!isAdmin) {
        throw new Error('User must be admin to add trucks');
      }

      const { data, error } = await supabase
        .from('trucks')
        .insert([truck])
        .select()
        .single();

      if (error) {
        console.error('Error inserting truck:', error);
        throw error;
      }

      console.log('Truck added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({
        title: "Success",
        description: "Truck added successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to add truck:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add truck. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTruck = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('User must be authenticated to delete trucks');
      }

      if (!isAdmin) {
        throw new Error('User must be admin to delete trucks');
      }

      const { error } = await supabase
        .from('trucks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting truck:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({
        title: "Success",
        description: "Truck deleted successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete truck:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete truck. Please try again.",
        variant: "destructive",
      });
    },
  });
};
