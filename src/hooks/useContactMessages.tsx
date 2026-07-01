import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitForm, type SubmitFormInput } from '@/hooks/useSubmitForm';

export type MessageSource = 'vehicle' | 'general' | 'quote' | 'parts' | 'sell_equipment' | (string & {});
export type MessageStatus = 'unread' | 'read' | 'answered' | 'archived';

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
  metadata: Record<string, unknown> | null;
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

/**
 * Thin wrapper around the unified `useSubmitForm` hook. Kept for backward
 * compatibility — new code should call `useSubmitForm` directly.
 */
export const useCreateContactMessage = () => {
  const submit = useSubmitForm();
  return {
    ...submit,
    mutateAsync: (input: CreateContactMessageInput) =>
      submit.mutateAsync(input as unknown as SubmitFormInput),
    mutate: (input: CreateContactMessageInput) =>
      submit.mutate(input as unknown as SubmitFormInput),
  };
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