// Cliente Resend único para todas as funções.
// A ligação Resend deste projeto é gerida pelo conector Lovable (gateway):
// as chamadas TÊM de passar por connector-gateway.lovable.dev, autenticadas
// com LOVABLE_API_KEY + X-Connection-Api-Key. Chamadas diretas a
// api.resend.com com a chave do conector falham sempre a autenticação —
// era essa a causa das publicações de newsletter que nunca chegavam.
const GATEWAY = "https://connector-gateway.lovable.dev/resend";
const DIRECT = "https://api.resend.com";

export function resendConfigured(): boolean {
  return !!Deno.env.get("RESEND_API_KEY");
}

/** `path` começa por "/" (ex.: "/emails/batch"). */
export function resendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const apiKey = Deno.env.get("RESEND_API_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  let url: string;
  if (lovableKey) {
    url = `${GATEWAY}${path}`;
    headers["Authorization"] = `Bearer ${lovableKey}`;
    headers["X-Connection-Api-Key"] = apiKey;
  } else {
    url = `${DIRECT}${path}`;
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return fetch(url, { ...init, headers });
}
