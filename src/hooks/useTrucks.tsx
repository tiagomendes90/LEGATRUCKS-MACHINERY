
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ensureAdminProfile, forceCreateAdminProfile } from '@/utils/adminSetup';

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
      console.log('Adding truck:', truck.brand, truck.model);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User authentication error:', userError);
        throw new Error('You must be logged in to add trucks');
      }

      console.log('User authenticated:', user.email);

      // Ensure admin profile exists
      try {
        await ensureAdminProfile();
        console.log('Admin profile confirmed');
      } catch (error) {
        console.log('Failed to ensure admin profile, trying force create...');
        try {
          await forceCreateAdminProfile();
          console.log('Admin profile force created');
        } catch (forceError) {
          console.error('Failed to force create admin profile:', forceError);
          throw new Error('Failed to set up admin profile');
        }
      }

      // Add a small delay to ensure profile is created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to insert the truck
      const { data, error } = await supabase
        .from('trucks')
        .insert([truck])
        .select()
        .single();

      if (error) {
        console.error('Error inserting truck:', error);
        
        // If RLS error, try to force create admin profile and retry once
        if (error.code === '42501') {
          console.log('RLS error detected, retrying with fresh admin profile...');
          await forceCreateAdminProfile();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: retryData, error: retryError } = await supabase
            .from('trucks')
            .insert([truck])
            .select()
            .single();
            
          if (retryError) {
            console.error('Retry failed:', retryError);
            throw retryError;
          }
          
          return retryData;
        }
        
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
