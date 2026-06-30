import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapAntiSpamError } from "@/lib/antiSpamErrors";

/**
 * Single submission hook used by every public form on the website.
 * To add a new form, call `useSubmitForm()` with a new `source` value —
 * no new hook, no new edge function, no new table.
 */
export type SubmitFormSource =
  | "general"
  | "vehicle"
  | "quote"
  | "parts"
  | "sell_equipment"
  | (string & {});

export interface SubmitFormInput {
  source: SubmitFormSource;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  // Optional typed fields (used by current forms)
  vehicle_id?: string | null;
  vehicle_title?: string | null;
  vehicle_url?: string | null;
  vehicle_price?: number | null;
  interest?: string | null;
  company?: string | null;
  // Free-form per-source extras (future forms)
  metadata?: Record<string, unknown> | null;
  // Anti-spam (from <AntiSpamFields />)
  turnstileToken: string;
  honeypot?: string;
  elapsedMs?: number;
}

export interface UseSubmitFormOptions {
  /** Override the default success toast. Pass `null` to disable. */
  successToast?: { title: string; description?: string } | null;
  /** Called after the server responds with ok. */
  onSuccess?: () => void;
}

const DEFAULT_SUCCESS = {
  title: "Mensagem enviada",
  description:
    "Recebemos a sua mensagem e entraremos em contacto em breve.",
};

export function useSubmitForm(options: UseSubmitFormOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitFormInput) => {
      const { data, error } = await supabase.functions.invoke("submit-form", {
        body: {
          source: input.source,
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          message: input.message ?? null,
          vehicle_id: input.vehicle_id ?? null,
          vehicle_title: input.vehicle_title ?? null,
          vehicle_url: input.vehicle_url ?? null,
          vehicle_price: input.vehicle_price ?? null,
          interest: input.interest ?? null,
          company: input.company ?? null,
          metadata: input.metadata ?? null,
          turnstileToken: input.turnstileToken,
          honeypot: input.honeypot ?? "",
          elapsedMs: input.elapsedMs ?? 0,
        },
      });
      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      if (options.successToast !== null) {
        toast(options.successToast ?? DEFAULT_SUCCESS);
      }
      options.onSuccess?.();
    },
    onError: (error: any) => {
      toast(mapAntiSpamError(error));
    },
  });
}