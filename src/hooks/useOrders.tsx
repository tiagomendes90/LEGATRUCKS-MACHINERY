import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  truck_id: string | null;
  truck_model: string;
  order_date: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at?: string;
  updated_at?: string;
}

export const useOrders = (status?: string, limit = 100) => {
  return useQuery({
    queryKey: ['orders', status, limit],
    queryFn: async () => {
      console.log('Fetching orders with indexed query...');
      
      // Use indexed columns for better performance
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false }) // Uses idx_orders_created_at index
        .limit(limit);

      if (status) {
        query = query.eq('status', status); // Uses idx_orders_status index
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched successfully:', data?.length || 0, 'orders found');
      return data as Order[];
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes (orders change more frequently)
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useAddOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Order Added",
        description: "New order has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add order: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Order> }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Order Updated",
        description: "Order has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update order: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Order Deleted",
        description: "Order has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete order: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
