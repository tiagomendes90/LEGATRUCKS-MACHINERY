
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Truck {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  condition: string;
  engine: string;
  transmission: string;
  description: string;
  horsepower: number;
  features: string[];
  images: string[];
  category: string;
  created_at?: string;
  updated_at?: string;
}

export const useTrucks = () => {
  return useQuery({
    queryKey: ['trucks'],
    queryFn: async () => {
      console.log('Fetching trucks...');
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trucks:', error);
        throw error;
      }
      console.log('Trucks fetched successfully:', data?.length || 0);
      return data as Truck[];
    },
  });
};

export const useAddTruck = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (truck: Omit<Truck, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('Attempting to add truck:', truck.brand, truck.model);
      
      // First check if user is logged in and has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to add trucks');
      }

      console.log('User authenticated:', user.email);

      // Check user profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Unable to verify user permissions');
      }

      if (!profile || profile.role !== 'admin') {
        throw new Error('You must be an admin to add trucks');
      }

      console.log('User has admin role, proceeding with truck creation');

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
        title: "Truck Added",
        description: "New truck has been added to the inventory successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Add truck mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to add truck: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTruck = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trucks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({
        title: "Truck Deleted",
        description: "Truck has been removed from the inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete truck: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
