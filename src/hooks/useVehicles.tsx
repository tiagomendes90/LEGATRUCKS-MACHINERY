
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Vehicle {
  id: string;
  title: string;
  description: string;
  brand_id: string;
  subcategory_id: string;
  condition: 'new' | 'used' | 'restored' | 'modified';
  registration_year: number;
  mileage_km?: number;
  operating_hours?: number;
  price_eur: number;
  fuel_type?: 'diesel' | 'electric' | 'hybrid' | 'petrol' | 'gas';
  gearbox?: 'manual' | 'automatic' | 'semi-automatic';
  power_ps?: number;
  drivetrain?: '4x2' | '4x4' | '6x2' | '6x4' | '8x4' | '8x6';
  axles?: number;
  weight_kg?: number;
  body_color?: string;
  main_image_url?: string;
  location?: string;
  contact_info?: string;
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  brand?: { name: string; slug: string };
  subcategory?: { name: string; slug: string; category: { name: string; slug: string } };
  images?: { image_url: string; sort_order: number }[];
}

export interface VehicleFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  condition?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  fuelType?: string;
  gearbox?: string;
  drivetrain?: string;
  location?: string;
  mileageFrom?: number;
  mileageTo?: number;
  operatingHoursFrom?: number;
  operatingHoursTo?: number;
  powerFrom?: number;
  powerTo?: number;
  sortBy?: string;
}

export const useVehicles = (filters?: VehicleFilters, limit = 12) => {
  return useQuery({
    queryKey: ['vehicles', filters, limit],
    queryFn: async () => {
      console.log('Fetching vehicles with filters:', filters);
      
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          brand:vehicle_brands(name, slug),
          subcategory:subcategories(
            name, 
            slug,
            category:categories(name, slug)
          ),
          images:vehicle_images(image_url, sort_order)
        `)
        .eq('is_active', true)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('subcategory.category.slug', filters.category);
      }

      if (filters?.subcategory) {
        query = query.eq('subcategory.slug', filters.subcategory);
      }

      if (filters?.brand) {
        query = query.eq('brand.slug', filters.brand);
      }

      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }

      if (filters?.yearFrom) {
        query = query.gte('registration_year', filters.yearFrom);
      }

      if (filters?.yearTo) {
        query = query.lte('registration_year', filters.yearTo);
      }

      if (filters?.priceFrom) {
        query = query.gte('price_eur', filters.priceFrom);
      }

      if (filters?.priceTo) {
        query = query.lte('price_eur', filters.priceTo);
      }

      if (filters?.fuelType) {
        query = query.eq('fuel_type', filters.fuelType);
      }

      if (filters?.gearbox) {
        query = query.eq('gearbox', filters.gearbox);
      }

      if (filters?.drivetrain) {
        query = query.eq('drivetrain', filters.drivetrain);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters?.mileageFrom) {
        query = query.gte('mileage_km', filters.mileageFrom);
      }

      if (filters?.mileageTo) {
        query = query.lte('mileage_km', filters.mileageTo);
      }

      if (filters?.operatingHoursFrom) {
        query = query.gte('operating_hours', filters.operatingHoursFrom);
      }

      if (filters?.operatingHoursTo) {
        query = query.lte('operating_hours', filters.operatingHoursTo);
      }

      if (filters?.powerFrom) {
        query = query.gte('power_ps', filters.powerFrom);
      }

      if (filters?.powerTo) {
        query = query.lte('power_ps', filters.powerTo);
      }

      // Apply sorting
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price-low':
            query = query.order('price_eur', { ascending: true });
            break;
          case 'price-high':
            query = query.order('price_eur', { ascending: false });
            break;
          case 'year-new':
            query = query.order('registration_year', { ascending: false });
            break;
          case 'year-old':
            query = query.order('registration_year', { ascending: true });
            break;
          case 'mileage-low':
            query = query.order('mileage_km', { ascending: true });
            break;
          case 'mileage-high':
            query = query.order('mileage_km', { ascending: false });
            break;
          case 'hours-low':
            query = query.order('operating_hours', { ascending: true });
            break;
          case 'hours-high':
            query = query.order('operating_hours', { ascending: false });
            break;
          case 'power-low':
            query = query.order('power_ps', { ascending: true });
            break;
          case 'power-high':
            query = query.order('power_ps', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      console.log('Vehicles fetched successfully:', data?.length || 0);
      return data || [];
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 2000,
  });
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          brand:vehicle_brands(name, slug),
          subcategory:subcategories(
            name, 
            slug,
            category:categories(name, slug)
          ),
          images:vehicle_images(image_url, sort_order)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error fetching vehicle:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
};

export const useAddVehicle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'brand' | 'subcategory' | 'images'>) => {
      if (!user || !isAdmin) {
        throw new Error('Admin access required');
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicle])
        .select()
        .single();

      if (error) {
        console.error('Error inserting vehicle:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle added successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to add vehicle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add vehicle.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...vehicle }: Partial<Vehicle> & { id: string }) => {
      if (!user || !isAdmin) {
        throw new Error('Admin access required');
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicle)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating vehicle:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
      toast({
        title: "Success",
        description: "Vehicle updated successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to update vehicle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || !isAdmin) {
        throw new Error('Admin access required');
      }

      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting vehicle:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle deleted successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete vehicle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete vehicle.",
        variant: "destructive",
      });
    },
  });
};
