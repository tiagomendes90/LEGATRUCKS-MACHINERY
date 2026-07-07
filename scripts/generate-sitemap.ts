// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.
// Includes static pages + all published products fetched from Supabase.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://lega.pt";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://dzljzvkshlgnmwpvweas.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGp6dmtzaGxnbm13cHZ3ZWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDk4MjksImV4cCI6MjA4ODIyNTgyOX0.xTTDzaZQQs73Kex9ZmUUNWxC5qdyT9N9tGjvDMt_j4E";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/sobre", changefreq: "monthly", priority: "0.7" },
  { path: "/camioes", changefreq: "weekly", priority: "0.9" },
  { path: "/maquinas", changefreq: "weekly", priority: "0.9" },
  { path: "/tractores", changefreq: "weekly", priority: "0.9" },
  { path: "/reboques", changefreq: "weekly", priority: "0.9" },
  { path: "/pecas", changefreq: "weekly", priority: "0.9" },
  { path: "/contactos", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

async function fetchProductEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,updated_at,status&status=eq.active&order=updated_at.desc&limit=5000`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`sitemap: skipping products (HTTP ${res.status})`);
      return [];
    }
    const rows: Array<{ id: string; updated_at?: string }> = await res.json();
    return rows.map((r) => ({
      path: `/vehicle/${r.id}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 10) : undefined,
    }));
  } catch (err) {
    console.warn("sitemap: product fetch failed", err);
    return [];
  }
}

const productEntries = await fetchProductEntries();
const entries = [...staticEntries, ...productEntries];

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n"),
  ),
  `</urlset>`,
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${entries.length} entries — ${productEntries.length} products)`);