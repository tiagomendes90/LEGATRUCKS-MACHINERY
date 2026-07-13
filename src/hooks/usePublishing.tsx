import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/admin/supabaseClient";

export interface PublishingChannel {
  key: string;
  label: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updated_at: string;
}

export interface PublishingEventRow {
  id: string;
  event_type: string;
  product_id: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  attempts?: number;
  scheduled_for?: string | null;
  next_attempt_at?: string | null;
  last_error?: string | null;
}

export interface PublishingLogRow {
  id: string;
  event_id: string | null;
  channel_key: string;
  status: string;
  error: string | null;
  attempts: number;
  created_at: string;
  response: Record<string, unknown>;
}

export function usePublishingChannels() {
  return useQuery({
    queryKey: ["publishing_channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishing_channels")
        .select("*")
        .order("label");
      if (error) throw error;
      return (data ?? []) as unknown as PublishingChannel[];
    },
  });
}

export function useToggleChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("publishing_channels")
        .update({ enabled })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing_channels"] }),
  });
}

export function usePublishingEvents(limit = 30) {
  return useQuery({
    queryKey: ["publishing_events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishing_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as PublishingEventRow[];
    },
    refetchInterval: 15000,
  });
}

export function usePublishingLogs(eventId: string | null) {
  return useQuery({
    queryKey: ["publishing_logs", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishing_logs")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PublishingLogRow[];
    },
  });
}

export function useRetryEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      await supabase
        .from("publishing_events")
        .update({
          status: "pending",
          next_attempt_at: null,
          locked_at: null,
          locked_by: null,
        })
        .eq("id", eventId);
      await supabase.functions.invoke("publish-dispatcher", { body: { event_id: eventId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["publishing_events"] });
      qc.invalidateQueries({ queryKey: ["publishing_logs"] });
    },
  });
}