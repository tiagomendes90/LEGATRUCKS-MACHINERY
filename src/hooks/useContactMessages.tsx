import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { mapAntiSpamError } from '@/lib/antiSpamErrors';

export type MessageSource = 'vehicle' | 'general';
export type MessageStatus = 'unread' | 'read' | 'answered';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source: MessageSource;
  vehicle_id: string | null;
  vehicle_title: string | null;
  vehicle_url: string | null;
  interest: string | null;
  company: string | null;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  source: MessageSource;
  vehicle_id?: string | null;
  vehicle_title?: string | null;
  vehicle_url?: string | null;
  interest?: string | null;
  company?: string | null;
  // anti-spam
  turnstileToken: string;
  honeypot?: string;
  elapsedMs?: number;
}

export const useCreateContactMessage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactMessageInput) => {
      const { data, error } = await supabase.functions.invoke('submit-contact-message', {
        body: {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          message: input.message,
          source: input.source,
          vehicle_id: input.vehicle_id ?? null,
          vehicle_title: input.vehicle_title ?? null,
          vehicle_url: input.vehicle_url ?? null,
          interest: input.interest ?? null,
          company: input.company ?? null,
          turnstileToken: input.turnstileToken,
          honeypot: input.honeypot ?? '',
          elapsedMs: input.elapsedMs ?? 0,
        },
      });
      if (error) throw error;
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast({
        title: 'Mensagem enviada',
        description: 'Recebemos a sua mensagem e entraremos em contacto em breve.',
      });
    },
    onError: (error: any) => {
      toast(mapAntiSpamError(error));
    },
  });
};

export const useContactMessages = () => {
  const { user, isAdmin } = useAuth();
  return useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ContactMessage[];
    },
    enabled: !!(user && isAdmin),
    staleTime: 1000 * 30,
  });
};

export const useUpdateContactMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<ContactMessage, 'status'>> }) => {
      const { data, error } = await supabase
        .from('contact_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteContactMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast({ title: 'Mensagem eliminada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
};