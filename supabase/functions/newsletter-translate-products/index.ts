// Tradução do conteúdo textual dos produtos incluídos numa newsletter.
// Admin-only. Usa o Lovable AI Gateway (LOVABLE_API_KEY).
//
// Princípios:
//  - NUNCA altera os dados originais em `products`; escreve apenas em
//    `product_translations` (título + descrição por idioma).
//  - Termos livres (categoria, subcategoria, rótulos e valores textuais de
//    especificações) vão para `newsletter_translations` com chave `term.<x>`.
//  - Marcas, modelos, números, unidades, datas, preços, códigos e URLs
//    permanecem intactos.
//  - Idempotente: só traduz o que ainda não existe (salvo `force: true`),
//    logo o preview e o envio usam sempre exactamente a mesma versão.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const MODEL = "google/gemini-3.7-flash";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const termKey = (t: string) => `term.${t.toLowerCase().replace(/\s+/g, " ").trim()}`;

async function translateJson(
  apiKey: string,
  payload: Record<string, string>,
  sourceLang: string,
  targetLabel: string,
): Promise<Record<string, string>> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You translate vehicle and machinery listings for LEGA, a trucks and machinery dealer. " +
            `Translate every value from ${sourceLang} into ${targetLabel}. ` +
            "STRICT RULES: never translate brand names (Peugeot, Mercedes-Benz, Volvo, ...), " +
            "model names, numbers, units, measurements, mileage, power, displacement, seats, " +
            "dates, prices, references, codes, URLs or IDs — copy them exactly. " +
            "Keep line breaks and overall structure. Keep a professional commercial tone. " +
            "Reply ONLY with a JSON object using exactly the same keys as the input.",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
  });
  if (res.status === 429) throw new Error("rate_limited");
  if (res.status === 402) throw new Error("payment_required");
  if (!res.ok) throw new Error(`ai_failed:${res.status}:${(await res.text().catch(() => "")).slice(0, 300)}`);
  const data = await res.json();
  const raw = String(data?.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed ?? {})) {
      if (typeof v === "string" && v.trim() !== "") out[k] = v.trim();
    }
    return out;
  } catch {
    throw new Error("ai_bad_json");
  }
}

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
    const productIds: string[] = Array.isArray(body?.product_ids)
      ? body.product_ids.filter((v: unknown) => typeof v === "string" && UUID_RE.test(v)).slice(0, 50)
      : [];
    const requestedTargets: string[] = Array.isArray(body?.targets)
      ? body.targets.filter((v: unknown) => typeof v === "string" && /^[a-z]{2}$/i.test(String(v)))
      : [];
    const force = body?.force === true;
    const checkOnly = body?.check_only === true;
    if (productIds.length === 0) return json(400, { error: "no_products" });

    // ---- Idiomas ------------------------------------------------------
    const { data: langRows } = await admin
      .from("newsletter_languages")
      .select("code,label,is_active,is_default")
      .order("sort_order", { ascending: true });
    const langs = (langRows ?? []) as any[];
    const active = langs.filter((l) => l.is_active);
    const defaultLang = active.find((l) => l.is_default)?.code ?? active[0]?.code ?? "en";
    const targets = (requestedTargets.length > 0 ? requestedTargets : active.map((l) => l.code))
      .map((c) => c.toLowerCase())
      .filter((c, i, a) => a.indexOf(c) === i && active.some((l) => l.code === c));
    if (targets.length === 0) return json(400, { error: "no_targets" });
    const labelOf = (c: string) => langs.find((l) => l.code === c)?.label ?? c;

    // ---- Produtos + termos --------------------------------------------
    const { data: products, error: prodErr } = await admin
      .from("products")
      .select(`
        id, title, description,
        category:categories(name),
        subcategory:subcategories(name),
        specs:spec_values(value_text, definition:spec_definitions(label, name))
      `)
      .in("id", productIds);
    if (prodErr) return json(500, { error: "products_failed", detail: prodErr.message });

    const { data: existingRows } = await admin
      .from("product_translations")
      .select("product_id, language_code, title, description")
      .in("product_id", productIds);
    const have = new Set(
      ((existingRows ?? []) as any[])
        .filter((r) => (r.title ?? "").trim() !== "" || (r.description ?? "").trim() !== "")
        .map((r) => `${r.product_id}|${r.language_code}`),
    );

    // Termos livres presentes nos cartões (sem marcas nem modelos).
    const terms = new Set<string>();
    for (const p of (products ?? []) as any[]) {
      const push = (v: unknown) => {
        const s = typeof v === "string" ? v.trim() : "";
        if (s && !/^\d/.test(s)) terms.add(s);
      };
      push(p.category?.name);
      push(p.subcategory?.name);
      for (const sv of p.specs ?? []) {
        push(sv?.definition?.label);
        if (sv?.value_text && !/\d/.test(String(sv.value_text))) push(sv.value_text);
      }
    }
    const { data: termRows } = await admin
      .from("newsletter_translations")
      .select("language_code, key")
      .in("key", [...terms].map(termKey));
    const haveTerm = new Set(((termRows ?? []) as any[]).map((r) => `${r.key}|${r.language_code}`));

    // ---- Cobertura ------------------------------------------------------
    const coverage: Record<string, { total: number; translated: number; missing: string[] }> = {};
    for (const code of targets) {
      const missing = code === defaultLang
        ? []
        : productIds.filter((id) => !have.has(`${id}|${code}`));
      coverage[code] = {
        total: productIds.length,
        translated: productIds.length - missing.length,
        missing,
      };
    }
    if (checkOnly) return json(200, { ok: true, default_language: defaultLang, coverage });

    // ---- Geração ---------------------------------------------------------
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json(400, { error: "missing_ai_key" });

    const byId = new Map(((products ?? []) as any[]).map((p) => [p.id, p]));
    const written: Record<string, number> = {};

    for (const code of targets) {
      if (code === defaultLang) continue;
      written[code] = 0;

      const pending = force ? productIds : coverage[code].missing;
      for (const pid of pending) {
        const p = byId.get(pid);
        if (!p) continue;
        const payload: Record<string, string> = {};
        if ((p.title ?? "").trim()) payload.title = String(p.title);
        if ((p.description ?? "").trim()) payload.description = String(p.description);
        if (Object.keys(payload).length === 0) continue;

        const out = await translateJson(apiKey, payload, defaultLang, labelOf(code));
        const { error: upErr } = await admin.from("product_translations").upsert(
          {
            product_id: pid,
            language_code: code,
            title: out.title ?? null,
            description: out.description ?? null,
          },
          { onConflict: "product_id,language_code" },
        );
        if (upErr) return json(500, { error: "save_failed", detail: upErr.message });
        written[code] += 1;
      }

      // Termos em falta neste idioma (um único pedido por idioma).
      const missingTerms = [...terms].filter(
        (t) => force || !haveTerm.has(`${termKey(t)}|${code}`),
      );
      if (missingTerms.length > 0) {
        const payload: Record<string, string> = {};
        missingTerms.forEach((t, i) => (payload[`t${i}`] = t));
        const out = await translateJson(apiKey, payload, defaultLang, labelOf(code));
        const rows = missingTerms
          .map((t, i) => ({ language_code: code, key: termKey(t), value: out[`t${i}`] }))
          .filter((r) => typeof r.value === "string" && r.value.trim() !== "");
        if (rows.length > 0) {
          const { error: tErr } = await admin
            .from("newsletter_translations")
            .upsert(rows, { onConflict: "language_code,key" });
          if (tErr) console.warn("[translate-products] terms upsert", tErr.message);
        }
      }
    }

    // Cobertura final
    const { data: after } = await admin
      .from("product_translations")
      .select("product_id, language_code, title, description")
      .in("product_id", productIds);
    const haveAfter = new Set(
      ((after ?? []) as any[])
        .filter((r) => (r.title ?? "").trim() !== "" || (r.description ?? "").trim() !== "")
        .map((r) => `${r.product_id}|${r.language_code}`),
    );
    const finalCoverage: Record<string, { total: number; translated: number }> = {};
    for (const code of targets) {
      const translated = code === defaultLang
        ? productIds.length
        : productIds.filter((id) => haveAfter.has(`${id}|${code}`)).length;
      finalCoverage[code] = { total: productIds.length, translated };
    }

    return json(200, { ok: true, default_language: defaultLang, written, coverage: finalCoverage });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.startsWith("rate_limited") ? 429 : msg.startsWith("payment_required") ? 402 : 500;
    return json(status, { error: msg });
  }
});
