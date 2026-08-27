// Motor central de tradução de produtos e taxonomia da LEGA.
// Usado pela função `translate-products` (site + admin) e pelo alias
// `newsletter-translate-products` (compatibilidade).
//
// Princípios:
//  - NUNCA altera `products`, `categories` ou `subcategories`; escreve apenas
//    em `product_translations` e `taxonomy_translations`.
//  - Marcas, modelos, números, unidades, datas, preços, códigos e URLs ficam
//    intactos.
//  - Idempotente: só gera o que falta (salvo `force`), pelo que o site, o
//    preview e o envio mostram sempre exactamente a mesma versão.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const APP_LANGUAGES = ["pt", "en", "fr"] as const;
export const LANGUAGE_LABELS: Record<string, string> = {
  pt: "European Portuguese",
  en: "English",
  fr: "French",
};

const MODEL = "google/gemini-3.7-flash";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const termKey = (t: string) => `term.${t.toLowerCase().replace(/\s+/g, " ").trim()}`;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Valores técnicos nunca vão para tradução. */
function isTechnical(v: unknown): boolean {
  if (typeof v !== "string") return true;
  const s = v.trim();
  if (s === "" || s.length < 3) return true;
  if (/\d/.test(s)) return true;
  if (/^https?:\/\//i.test(s)) return true;
  if (/^[A-Z0-9._/-]+$/.test(s)) return true;
  return false;
}

async function translateJson(
  apiKey: string,
  payload: Record<string, string>,
  targetCode: string,
): Promise<Record<string, string>> {
  const targetLabel = LANGUAGE_LABELS[targetCode] ?? targetCode;
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
            `Translate every value into ${targetLabel}; detect the source language automatically. ` +
            "If a value is already written in the target language, return it unchanged. " +
            "STRICT RULES: never translate brand names (Peugeot, Mercedes-Benz, Volvo, Yanmar, ...), " +
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
  if (!res.ok) {
    throw new Error(`ai_failed:${res.status}:${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
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

export async function handleTranslateProducts(req: Request): Promise<Response> {
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
    const requested: string[] = Array.isArray(body?.targets)
      ? body.targets.map((v: unknown) => String(v).toLowerCase())
      : [];
    const force = body?.force === true;
    const checkOnly = body?.check_only === true;
    if (productIds.length === 0) return json(400, { error: "no_products" });

    const targets = (requested.length > 0 ? requested : [...APP_LANGUAGES])
      .filter((c, i, a) => a.indexOf(c) === i && (APP_LANGUAGES as readonly string[]).includes(c));
    if (targets.length === 0) return json(400, { error: "no_targets" });

    // ---- Produtos + taxonomia + especificações -------------------------
    const { data: products, error: prodErr } = await admin
      .from("products")
      .select(`
        id, title, description,
        category:categories(id, name),
        subcategory:subcategories(id, name, category:categories(id, name)),
        specs:spec_values(value_text, definition:spec_definitions(name, label))
      `)
      .in("id", productIds);
    if (prodErr) return json(500, { error: "products_failed", detail: prodErr.message });

    const rowsExisting = (
      await admin
        .from("product_translations")
        .select("product_id, language_code, title, description, fields")
        .in("product_id", productIds)
    ).data as any[] | null;
    const have = new Set(
      (rowsExisting ?? [])
        .filter((r) => (r.title ?? "").trim() !== "" || (r.description ?? "").trim() !== "")
        .map((r) => `${r.product_id}|${r.language_code}`),
    );

    // ---- Cobertura ------------------------------------------------------
    const coverage: Record<string, { total: number; translated: number; missing: string[] }> = {};
    for (const code of targets) {
      const missing = productIds.filter((id) => !have.has(`${id}|${code}`));
      coverage[code] = {
        total: productIds.length,
        translated: productIds.length - missing.length,
        missing,
      };
    }
    if (checkOnly) return json(200, { ok: true, coverage });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json(400, { error: "missing_ai_key" });

    // Taxonomia envolvida (categorias e subcategorias distintas).
    const taxonomy = new Map<string, { type: "category" | "subcategory"; id: string; name: string }>();
    for (const p of (products ?? []) as any[]) {
      const cat = p.category ?? p.subcategory?.category;
      if (cat?.id && cat?.name) taxonomy.set(`category|${cat.id}`, { type: "category", id: cat.id, name: cat.name });
      if (p.subcategory?.id && p.subcategory?.name) {
        taxonomy.set(`subcategory|${p.subcategory.id}`, {
          type: "subcategory",
          id: p.subcategory.id,
          name: p.subcategory.name,
        });
      }
    }
    const existingTax = (
      await admin
        .from("taxonomy_translations")
        .select("entity_type, entity_id, language_code")
        .in("entity_id", [...taxonomy.values()].map((t) => t.id))
    ).data as any[] | null;
    const haveTax = new Set(
      (existingTax ?? []).map((r) => `${r.entity_type}|${r.entity_id}|${r.language_code}`),
    );

    const byId = new Map(((products ?? []) as any[]).map((p) => [p.id, p]));
    const written: Record<string, number> = {};

    for (const code of targets) {
      written[code] = 0;

      /* ---------- Produtos: título, descrição, rótulos e valores ---------- */
      const pending = force ? productIds : coverage[code].missing;
      for (const pid of pending) {
        const p = byId.get(pid);
        if (!p) continue;

        const payload: Record<string, string> = {};
        if ((p.title ?? "").trim()) payload.title = String(p.title);
        if ((p.description ?? "").trim()) payload.description = String(p.description);

        // Rótulos e valores textuais das especificações (nunca números).
        const fieldKeys = new Map<string, string>(); // payloadKey -> fieldKey
        let i = 0;
        for (const sv of p.specs ?? []) {
          const def = sv?.definition;
          const label = def?.label ?? def?.name;
          if (label && !isTechnical(label)) {
            const k = `f${i++}`;
            payload[k] = String(label);
            fieldKeys.set(k, `label:${def.name}`);
          }
          if (sv?.value_text && !isTechnical(sv.value_text)) {
            const k = `f${i++}`;
            payload[k] = String(sv.value_text);
            fieldKeys.set(k, `spec:${String(sv.value_text).trim().toLowerCase()}`);
          }
        }
        if (Object.keys(payload).length === 0) continue;

        const out = await translateJson(apiKey, payload, code);
        const fields: Record<string, string> = {};
        for (const [pk, fk] of fieldKeys) {
          if (out[pk]) fields[fk] = out[pk];
        }

        const { error: upErr } = await admin.from("product_translations").upsert(
          {
            product_id: pid,
            language_code: code,
            title: out.title ?? null,
            description: out.description ?? null,
            fields,
          },
          { onConflict: "product_id,language_code" },
        );
        if (upErr) return json(500, { error: "save_failed", detail: upErr.message });
        written[code] += 1;
      }

      /* ---------------------- Taxonomia ---------------------- */
      const missingTax = [...taxonomy.values()].filter(
        (t) => force || !haveTax.has(`${t.type}|${t.id}|${code}`),
      );
      if (missingTax.length > 0) {
        const payload: Record<string, string> = {};
        missingTax.forEach((t, idx) => (payload[`x${idx}`] = t.name));
        const out = await translateJson(apiKey, payload, code);
        const rows = missingTax
          .map((t, idx) => ({
            entity_type: t.type,
            entity_id: t.id,
            language_code: code,
            name: out[`x${idx}`],
          }))
          .filter((r) => typeof r.name === "string" && r.name.trim() !== "");
        if (rows.length > 0) {
          const { error: tErr } = await admin
            .from("taxonomy_translations")
            .upsert(rows, { onConflict: "entity_type,entity_id,language_code" });
          if (tErr) console.warn("[translate-products] taxonomy upsert", tErr.message);

          // Compatibilidade: a newsletter também lê `term.<nome>`.
          const termRows = missingTax
            .map((t, idx) => ({ language_code: code, key: termKey(t.name), value: out[`x${idx}`] }))
            .filter((r) => typeof r.value === "string" && r.value.trim() !== "");
          if (termRows.length > 0) {
            await admin
              .from("newsletter_translations")
              .upsert(termRows, { onConflict: "language_code,key" });
          }
        }
      }
    }

    // ---- Cobertura final -------------------------------------------------
    const after = (
      await admin
        .from("product_translations")
        .select("product_id, language_code, title, description")
        .in("product_id", productIds)
    ).data as any[] | null;
    const haveAfter = new Set(
      (after ?? [])
        .filter((r) => (r.title ?? "").trim() !== "" || (r.description ?? "").trim() !== "")
        .map((r) => `${r.product_id}|${r.language_code}`),
    );
    const finalCoverage: Record<string, { total: number; translated: number }> = {};
    for (const code of targets) {
      finalCoverage[code] = {
        total: productIds.length,
        translated: productIds.filter((id) => haveAfter.has(`${id}|${code}`)).length,
      };
    }

    return json(200, { ok: true, written, coverage: finalCoverage });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.startsWith("rate_limited") ? 429 : msg.startsWith("payment_required") ? 402 : 500;
    return json(status, { error: msg });
  }
}
