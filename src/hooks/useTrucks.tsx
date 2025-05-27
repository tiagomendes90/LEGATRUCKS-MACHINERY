
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
  createdAt?: string;
  updatedAt?: string;
}

export const useTrucks = () => {
  return useQuery({
    queryKey: ['trucks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as Truck[];
    },
  });
};

export const useAddTruck = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (truck: Omit<Truck, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('trucks')
        .insert([truck])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({
        title: "Truck Added",
        description: "New truck has been added to the inventory successfully.",
      });
    },
    onError: (error) => {
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
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete truck: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
