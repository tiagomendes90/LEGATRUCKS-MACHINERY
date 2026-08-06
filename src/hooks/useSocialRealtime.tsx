import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/admin/supabaseClient";

/**
 * Mantém o painel de publicação sincronizado em tempo real:
 * ouve alterações em products / product_social_posts / publishing_events
 * e invalida as queries correspondentes, para que o estado dos posts
 * mude sozinho sem o administrador ter de recarregar a página.
 */
export function useSocialRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ["social_products"] });
      qc.invalidateQueries({ queryKey: ["social_posts"] });
      qc.invalidateQueries({ queryKey: ["publishing_events"] });
      qc.invalidateQueries({ queryKey: ["publishing_logs"] });
    };

    const channel = supabase
      .channel("admin-social-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "publishing_events" },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_social_posts" },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        invalidate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}