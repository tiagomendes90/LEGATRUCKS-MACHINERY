
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VehicleSpecifications {
  id?: string;
  truck_id: string;
  fuel_type?: string;
  drive_type?: string;
  cabin_type?: string;
  axle_configuration?: string;
  euro_standard?: string;
  suspension_type?: string;
  retarder?: boolean;
  air_conditioning?: boolean;
  cruise_control?: boolean;
  abs_brakes?: boolean;
  ebs_brakes?: boolean;
  esp_system?: boolean;
  lane_departure_warning?: boolean;
  adaptive_cruise_control?: boolean;
  collision_avoidance?: boolean;
  blind_spot_monitoring?: boolean;
  hydraulic_system?: string;
  pto_available?: boolean;
  winch_available?: boolean;
  crane_capacity?: string;
  loading_capacity?: number;
  max_reach?: number;
  operating_weight?: number;
  bucket_capacity?: number;
  lifting_capacity?: number;
  working_pressure?: number;
  fuel_consumption?: number;
  noise_level?: number;
}

export const useVehicleSpecifications = (truckId?: string) => {
  return useQuery({
    queryKey: ['vehicleSpecifications', truckId],
    queryFn: async () => {
      if (!truckId) return null;
      
      const { data, error } = await supabase
        .from('vehicle_specifications')
        .select('*')
        .eq('truck_id', truckId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!truckId,
  });
};

export const useAddVehicleSpecifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (specs: VehicleSpecifications) => {
      const { data, error } = await supabase
        .from('vehicle_specifications')
        .insert([specs])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleSpecifications'] });
      toast({
        title: "Success",
        description: "Vehicle specifications added successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to add specifications:', error);
      toast({
        title: "Error",
        description: "Failed to add specifications. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateVehicleSpecifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VehicleSpecifications> }) => {
      const { data, error } = await supabase
        .from('vehicle_specifications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleSpecifications'] });
      toast({
        title: "Success",
        description: "Vehicle specifications updated successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to update specifications:', error);
      toast({
        title: "Error",
        description: "Failed to update specifications. Please try again.",
        variant: "destructive",
      });
    },
  });
};
