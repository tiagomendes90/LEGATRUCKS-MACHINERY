import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Vehicle {
  id: string;
  title: string;
  description: string;
  brand_id: string;
  category_id: string;
  subcategory_id: string;
  condition: string;
  year: number;
  price: number;
  currency: string;
  model: string;
  stock_status: string;
  location_country: string;
  location_city: string;
  is_active: boolean;
  created_at: string;
  // Joined data
  brand?: { name: string; slug: string };
  subcategory?: { name: string; slug: string; category?: { name: string; slug: string } };
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
  sortBy?: string;
}

export const useVehicles = (filters?: VehicleFilters, limit = 12, includeUnpublished = false) => {
  return useQuery({
    queryKey: ['vehicles', filters, limit, includeUnpublished],
    queryFn: async () => {
      console.log('Fetching products with filters:', filters);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          brand:brands(name, slug),
          subcategory:subcategories(
            name, 
            slug,
            category:categories(name, slug)
          ),
          images:product_images(image_url, sort_order)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply category filter
      if (filters?.category) {
        console.log('Filtering by category:', filters.category);
        
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.category)
          .single();
        
        if (categoryData) {
          const { data: subcategoryIds } = await supabase
            .from('subcategories')
            .select('id')
            .eq('category_id', categoryData.id);
          
          if (subcategoryIds && subcategoryIds.length > 0) {
            const ids = subcategoryIds.map(sub => sub.id);
            query = query.in('subcategory_id', ids);
          } else {
            return [];
          }
        } else {
          return [];
        }
      }

      if (filters?.subcategory) {
        const { data: subcategoryData } = await supabase
          .from('subcategories')
          .select('id')
          .eq('slug', filters.subcategory)
          .single();
        
        if (subcategoryData) {
          query = query.eq('subcategory_id', subcategoryData.id);
        }
      }

      if (filters?.brand) {
        const { data: brandData } = await supabase
          .from('brands')
          .select('id')
          .eq('slug', filters.brand)
          .single();
        
        if (brandData) {
          query = query.eq('brand_id', brandData.id);
        }
      }

      if (filters?.condition) query = query.eq('condition', filters.condition);
      if (filters?.yearFrom) query = query.gte('year', filters.yearFrom);
      if (filters?.yearTo) query = query.lte('year', filters.yearTo);
      if (filters?.priceFrom) query = query.gte('price', filters.priceFrom);
      if (filters?.priceTo) query = query.lte('price', filters.priceTo);

      // Apply sorting
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price-low': query = query.order('price', { ascending: true }); break;
          case 'price-high': query = query.order('price', { ascending: false }); break;
          case 'year-new': query = query.order('year', { ascending: false }); break;
          case 'year-old': query = query.order('year', { ascending: true }); break;
          default: query = query.order('created_at', { ascending: false });
        }
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      console.log('Products fetched successfully:', data?.length || 0);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
    retryDelay: 2000,
  });
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(name, slug),
          subcategory:subcategories(
            name, 
            slug,
            category:categories(name, slug)
          ),
          images:product_images(image_url, sort_order)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
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
    mutationFn: async (vehicle: any) => {
      if (!user || !isAdmin) throw new Error('Admin access required');

      const { data, error } = await supabase
        .from('products')
        .insert([vehicle])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: "Sucesso", description: "Produto adicionado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Falha ao adicionar.", variant: "destructive" });
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...vehicle }: any) => {
      if (!user || !isAdmin) throw new Error('Admin access required');

      const { data, error } = await supabase
        .from('products')
        .update(vehicle)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
      toast({ title: "Sucesso", description: "Produto atualizado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar.", variant: "destructive" });
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user || !isAdmin) throw new Error('Admin access required');

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: "Sucesso", description: "Produto eliminado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Falha ao eliminar.", variant: "destructive" });
    },
  });
};
