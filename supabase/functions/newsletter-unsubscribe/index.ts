// Public unsubscribe endpoint. GET /?token=<uuid> marks the subscriber
import { resendFetch } from "../_shared/resendClient.ts";
// as unsubscribed and returns a small confirmation HTML page.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


function htmlResponse(status: number, body: string) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function page(title: string, message: string): string {
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{background:#fff;padding:40px;border-radius:12px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.06)}
h1{margin:0 0 12px;font-size:22px}p{margin:0 0 12px;color:#475569;line-height:1.6}
a{color:#f97316;text-decoration:none;font-weight:600}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p><p><a href="https://www.lega.pt">Voltar ao site LEGA</a></p></div></body></html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return htmlResponse(400, page("Link inválido", "O link de cancelamento não é válido."));
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: sub, error } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, status, resend_contact_id")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (error || !sub) {
      return htmlResponse(404, page("Subscritor não encontrado", "O link não corresponde a nenhum subscritor ativo."));
    }
    if (sub.status === "unsubscribed") {
      return htmlResponse(200, page("Já cancelaste a subscrição", "Não voltarás a receber emails da newsletter LEGA."));
    }

    await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", sub.id);

    // Best-effort Resend sync.
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const audienceId = Deno.env.get("RESEND_AUDIENCE_ID");
    if (apiKey && audienceId && sub.resend_contact_id) {
      try {
        await resendFetch(`/audiences/${audienceId}/contacts/${sub.resend_contact_id}`, {
          method: "PATCH",
          body: JSON.stringify({ unsubscribed: true }),
        });
      } catch (err) {
        console.warn("[newsletter-unsubscribe] resend sync failed", err);
      }
    }

    return htmlResponse(200, page(
      "Subscrição cancelada",
      "Não voltarás a receber emails da newsletter LEGA. Podes voltar a subscrever a qualquer momento no rodapé do site.",
    ));
  } catch (err) {
    console.error("[newsletter-unsubscribe]", err);
    return htmlResponse(500, page("Erro inesperado", "Não foi possível cancelar a subscrição. Tenta novamente mais tarde."));
  }
});