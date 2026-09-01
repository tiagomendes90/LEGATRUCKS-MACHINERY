// Tradução automática do conteúdo editorial de uma campanha de newsletter.
// Admin-only. Usa o Lovable AI Gateway (LOVABLE_API_KEY).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const FIELDS = ["subject", "preheader", "title", "intro", "outro", "cta_label", "footer_note"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json(401, { error: "unauthorized" });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userRes } = await admin.auth.getUser(token);
    const uid = userRes?.user?.id;
    if (!uid) return json(401, { error: "unauthorized" });
    const { data: profile } = await admin.from("profiles").select("role").eq("id", uid).maybeSingle();
    if (profile?.role !== "admin") return json(403, { error: "forbidden" });

    const body = await req.json().catch(() => ({}));
    const source = (body?.source ?? {}) as Record<string, string | null>;
    const sourceLang = String(body?.source_language ?? "en");
    const targets: string[] = Array.isArray(body?.targets) ? body.targets.filter((t: unknown) => typeof t === "string") : [];
    if (targets.length === 0) return json(400, { error: "no_targets" });

    const payload: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = source[f];
      if (typeof v === "string" && v.trim() !== "") payload[f] = v;
    }
    if (Object.keys(payload).length === 0) return json(400, { error: "empty_source" });

    const { data: langRows } = await admin
      .from("newsletter_languages")
      .select("code,label")
      .in("code", targets);
    const labelOf = (c: string) =>
      (langRows ?? []).find((l: any) => l.code === c)?.label ?? c;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json(400, { error: "missing_ai_key" });

    const out: Record<string, Record<string, string>> = {};

    for (const target of targets) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You translate marketing newsletter copy for LEGA, a trucks and machinery dealer. " +
                "Translate every value from " + sourceLang + " into " + labelOf(target) + ". " +
                "Keep tone professional and commercial, preserve emojis, line breaks and placeholders like {name}. " +
                "Do not translate brand or model names. Reply ONLY with a JSON object using the same keys.",
            },
            { role: "user", content: JSON.stringify(payload) },
          ],
        }),
      });

      if (res.status === 429) return json(429, { error: "rate_limited" });
      if (res.status === 402) return json(402, { error: "payment_required" });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return json(502, { error: "ai_failed", detail });
      }

      const data = await res.json();
      const raw = String(data?.choices?.[0]?.message?.content ?? "").trim();
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      let parsed: Record<string, string> = {};
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return json(502, { error: "ai_bad_json", detail: raw.slice(0, 400) });
      }
      const clean: Record<string, string> = {};
      for (const f of FIELDS) {
        const v = parsed[f];
        if (typeof v === "string" && v.trim() !== "") clean[f] = v;
      }
      out[target] = clean;
    }

    return json(200, { ok: true, translations: out });
  } catch (err) {
    return json(500, { error: "unexpected", detail: err instanceof Error ? err.message : String(err) });
  }
});
