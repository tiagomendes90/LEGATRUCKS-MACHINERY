// Dynamic sitemap Edge Function.
// Public endpoint — reads directly from the database and returns
// application/xml. Products that are inactive or deleted disappear
// automatically. No rebuild required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://lega.pt";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const STATIC_ENTRIES: UrlEntry[] = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/sobre", changefreq: "monthly", priority: "0.7" },
  { loc: "/camioes", changefreq: "weekly", priority: "0.9" },
  { loc: "/maquinas", changefreq: "weekly", priority: "0.9" },
  { loc: "/tractores", changefreq: "weekly", priority: "0.9" },
  { loc: "/reboques", changefreq: "weekly", priority: "0.9" },
  { loc: "/pecas", changefreq: "weekly", priority: "0.9" },
  { loc: "/contactos", changefreq: "monthly", priority: "0.6" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderXml(entries: UrlEntry[]): string {
  const urls = entries.map((e) => {
    const parts = [
      `  <url>`,
      `    <loc>${escapeXml(SITE_URL + e.loc)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean);
    return parts.join("\n");
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Products — only active/published, with lastmod
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at, created_at, is_active")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(10000);

    // Subcategory slug pages
    const { data: subs } = await supabase
      .from("subcategories")
      .select("slug, category:categories(slug)")
      .limit(500);

    const entries: UrlEntry[] = [...STATIC_ENTRIES];

    for (const s of subs ?? []) {
      const catSlug = (s as any).category?.slug;
      if (catSlug && (s as any).slug) {
        entries.push({
          loc: `/${catSlug}/${(s as any).slug}`,
          changefreq: "weekly",
          priority: "0.7",
        });
      }
    }

    for (const p of products ?? []) {
      const ts = (p as any).updated_at ?? (p as any).created_at;
      entries.push({
        loc: `/veiculo/${(p as any).id}`,
        lastmod: ts ? new Date(ts).toISOString().slice(0, 10) : undefined,
        changefreq: "weekly",
        priority: "0.8",
      });
    }

    const xml = renderXml(entries);
    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (err) {
    return new Response(
      `<!-- sitemap error: ${err instanceof Error ? err.message : String(err)} -->`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/xml" } },
    );
  }
});