
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ContactOrder {
  id: string;
  name: string;
  customer_email: string;
  truck_model: string;
  amount: number;
  status: string;
  payment_status: string;
  order_date: string;
  vehicle_id?: string;
  phone?: string | null;
  message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContactOrderData {
  name: string;
  customer_email: string;
  vehicle_id: string;
  vehicle_title: string;
  vehicle_price: number;
  phone?: string;
  message?: string;
}

export const useCreateContactOrder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderData: CreateContactOrderData) => {
      console.log('Creating contact order:', orderData);

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          name: orderData.name,
          customer_email: orderData.customer_email,
          vehicle_id: orderData.vehicle_id,
          truck_model: orderData.vehicle_title,
          amount: orderData.vehicle_price,
          status: 'pending',
          payment_status: 'pending',
          phone: orderData.phone || null,
          message: orderData.message || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating contact order:', error);
        throw error;
      }

      console.log('Contact order created successfully:', data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Contacto Enviado!",
        description: "O seu pedido de contacto foi enviado com sucesso. Entraremos em contacto em breve.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to create contact order:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar pedido de contacto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useContactOrders = () => {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['contact-orders'],
    queryFn: async () => {
      if (!user || !isAdmin) {
        throw new Error('Admin access required');
      }

      console.log('Fetching contact orders...');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact orders:', error);
        throw error;
      }

      console.log('Contact orders fetched:', data?.length || 0);
      return data || [];
    },
    enabled: !!(user && isAdmin),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!user || !isAdmin) {
        throw new Error('Admin access required');
      }

      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-orders'] });
      toast({
        title: "Success",
        description: "Order status updated successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Failed to update order status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    },
  });
};
