
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface FeaturedVehicle {
  id: string;
  product_id: string;
  display_order: number;
  created_at: string;
  product: {
    id: string;
    title: string;
    price: number;
    condition: string;
    year: number;
    brand?: { name: string; slug: string };
    subcategory?: { name: string; slug: string };
    images?: { image_url: string; sort_order: number }[];
  };
}

export const useFeaturedVehicles = () => {
  return useQuery({
    queryKey: ['featured-vehicles'],
    queryFn: async () => {
      console.log('Fetching featured products...');
      
      const { data, error } = await supabase
        .from('featured_products')
        .select(`
          *,
          product:products(
            id,
            title,
            price,
            condition,
            year,
            brand:brands(name, slug),
            subcategory:subcategories(name, slug),
            images:product_images(image_url, sort_order)
          )
        `)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching featured products:', error);
        throw error;
      }

      // Filter out entries where product is inactive
      const filtered = (data || []).filter((item: any) => item.product?.is_active !== false);

      console.log('Featured products fetched:', filtered.length);
      return filtered;
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
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
        .from('featured_products')
        .insert([{ product_id: vehicle_id, display_order: position }])
        .select()
        .single();

      if (error) {
        console.error('Error adding featured product:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-vehicles'] });
      toast({ title: "Sucesso", description: "Produto adicionado aos destaques!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Falha ao adicionar destaque.", variant: "destructive" });
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
        .from('featured_products')
        .update({ display_order: position })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-vehicles'] });
      toast({ title: "Sucesso", description: "Posição atualizada!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar posição.", variant: "destructive" });
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
        .from('featured_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-vehicles'] });
      toast({ title: "Sucesso", description: "Produto removido dos destaques!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Falha ao remover destaque.", variant: "destructive" });
    },
  });
};
