// Cron endpoint: renova automaticamente o token Meta (ver _shared/publishing/metaTokenRefresh.ts).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { refreshMetaConnection } from "../_shared/publishing/metaTokenRefresh.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const result = await refreshMetaConnection(admin);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
