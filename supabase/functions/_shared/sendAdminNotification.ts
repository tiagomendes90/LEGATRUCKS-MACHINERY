// Shared helper: sends a branded notification email to the admin inbox via Resend.
// Best-effort only: failures here MUST NOT break the calling edge function.

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend/emails";
const ADMIN_EMAIL = "info@lega.pt";
const FROM = "LEGA <notificacoes@notify.lega.pt>";
const SITE_URL = "https://lega.pt";
const LOGO_URL = "https://lega.pt/logo-hero.png";
const DASHBOARD_URL = `${SITE_URL}/admin`;

export type NotificationKind =
  | "contact_general"
  | "contact_vehicle"
  | "order_quote"
  | "parts_request"
  | "sell_equipment"
  | "other";

export interface AdminNotificationInput {
  kind: NotificationKind;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  vehicleTitle?: string | null;
  vehicleUrl?: string | null;
  vehiclePrice?: number | null;
  /** Extra fields (any source-specific data). Rendered as a generic table. */
  metadata?: Record<string, unknown> | null;
  /** Optional override for the source label shown in the email header. */
  sourceLabel?: string | null;
}

function escapeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSubject(i: AdminNotificationInput): string {
  switch (i.kind) {
    case "contact_vehicle":
      return `Novo contacto sobre veículo – ${i.vehicleTitle || "Veículo"}`;
    case "order_quote":
      return `Novo pedido de orçamento – ${i.vehicleTitle || "Veículo"}`;
    case "parts_request":
      return `Novo pedido de peças – ${i.name}`;
    case "sell_equipment":
      return `Nova proposta de venda de equipamento – ${i.name}`;
    case "other":
      return `Nova submissão de formulário – ${i.name}`;
    case "contact_general":
    default:
      return `Novo contacto geral – ${i.name}`;
  }
}

function defaultSourceLabel(kind: NotificationKind): string {
  switch (kind) {
    case "contact_vehicle":
      return "Formulário de contacto – Página de veículo";
    case "order_quote":
      return "Pedido de orçamento – Página de veículo";
    case "parts_request":
      return "Pedido de peças";
    case "sell_equipment":
      return "Venda de equipamento";
    case "other":
      return "Submissão de formulário";
    case "contact_general":
    default:
      return "Formulário de contacto – Página Contactos";
  }
}

function formatDate(d: Date): string {
  const fmt = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
  });
  return fmt.format(d);
}

function row(label: string, value: string): string {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 0;color:#64748b;font-size:13px;width:140px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${value}</td>
    </tr>`;
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderMetadataRows(
  metadata: Record<string, unknown> | null | undefined,
): string {
  if (!metadata) return "";
  return Object.entries(metadata)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => {
      const value =
        typeof v === "string" ? v : JSON.stringify(v, null, 2);
      return row(humanizeKey(k), escapeHtml(value));
    })
    .join("");
}

function buildHtml(i: AdminNotificationInput): string {
  const date = formatDate(new Date());
  const subject = buildSubject(i);
  const labelText = i.sourceLabel || defaultSourceLabel(i.kind);
  const vehicleBlock = i.vehicleTitle
    ? `${row("Veículo", escapeHtml(i.vehicleTitle))}${
        i.vehicleUrl
          ? row(
              "Link do anúncio",
              `<a href="${escapeHtml(i.vehicleUrl)}" style="color:#1d4ed8;text-decoration:none;">Abrir anúncio</a>`,
            )
          : ""
      }${
        typeof i.vehiclePrice === "number" && i.vehiclePrice > 0
          ? row("Preço indicativo", `€ ${i.vehiclePrice.toLocaleString("pt-PT")}`)
          : ""
      }`
    : "";

  const messageBlock = i.message
    ? `
      <div style="margin-top:24px;padding:16px 18px;background:#f8fafc;border-left:4px solid #1d4ed8;border-radius:6px;">
        <div style="font-size:12px;font-weight:600;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Mensagem</div>
        <div style="color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(i.message)}</div>
      </div>`
    : "";

  return `<!doctype html>
<html lang="pt">
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.06);">
        <tr>
          <td style="background:#0a2540;padding:24px 32px;" align="left">
            <img src="${LOGO_URL}" alt="LEGA" height="40" style="display:block;height:40px;width:auto;border:0;outline:none;text-decoration:none;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <div style="font-size:12px;font-weight:600;color:#ea580c;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${escapeHtml(labelText)}</div>
            <h1 style="margin:0 0 4px 0;font-size:22px;color:#0a2540;font-weight:700;">${escapeHtml(subject)}</h1>
            <div style="color:#64748b;font-size:13px;margin-bottom:24px;">${escapeHtml(date)}</div>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">
              ${row("Nome", escapeHtml(i.name))}
              ${row("Email", `<a href="mailto:${escapeHtml(i.email)}" style="color:#1d4ed8;text-decoration:none;">${escapeHtml(i.email)}</a>`)}
              ${i.phone ? row("Telefone", `<a href="tel:${escapeHtml(i.phone)}" style="color:#1d4ed8;text-decoration:none;">${escapeHtml(i.phone)}</a>`) : ""}
              ${vehicleBlock}
              ${renderMetadataRows(i.metadata)}
            </table>

            ${messageBlock}

            <div style="margin-top:32px;text-align:center;">
              <a href="${DASHBOARD_URL}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:8px;">Abrir Mensagem no Dashboard</a>
            </div>

            <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
              Esta é uma notificação automática do website <a href="${SITE_URL}" style="color:#64748b;text-decoration:none;">lega.pt</a>.<br>
              Para responder ao contacto, utilize o email indicado acima.
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(i: AdminNotificationInput): string {
  const lines = [
    buildSubject(i),
    formatDate(new Date()),
    "",
    `Origem: ${i.sourceLabel || defaultSourceLabel(i.kind)}`,
    `Nome: ${i.name}`,
    `Email: ${i.email}`,
  ];
  if (i.phone) lines.push(`Telefone: ${i.phone}`);
  if (i.vehicleTitle) lines.push(`Veículo: ${i.vehicleTitle}`);
  if (i.vehicleUrl) lines.push(`Link: ${i.vehicleUrl}`);
  if (typeof i.vehiclePrice === "number" && i.vehiclePrice > 0) {
    lines.push(`Preço indicativo: € ${i.vehiclePrice.toLocaleString("pt-PT")}`);
  }
  if (i.metadata) {
    for (const [k, v] of Object.entries(i.metadata)) {
      if (v === null || v === undefined || v === "") continue;
      const value = typeof v === "string" ? v : JSON.stringify(v);
      lines.push(`${humanizeKey(k)}: ${value}`);
    }
  }
  if (i.message) {
    lines.push("", "Mensagem:", i.message);
  }
  lines.push("", `Abrir no dashboard: ${DASHBOARD_URL}`);
  return lines.join("\n");
}

/**
 * Sends the admin notification email. Never throws — returns ok=false on failure
 * so the caller can continue without impacting the user.
 */
export async function sendAdminNotification(
  input: AdminNotificationInput,
): Promise<{ ok: boolean; error?: string }> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!lovableKey || !resendKey) {
    console.warn("[sendAdminNotification] missing keys", {
      lovableKey: !!lovableKey,
      resendKey: !!resendKey,
    });
    return { ok: false, error: "missing_keys" };
  }

  try {
    const res = await fetch(RESEND_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        reply_to: input.email,
        subject: buildSubject(input),
        html: buildHtml(input),
        text: buildText(input),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[sendAdminNotification] resend error", res.status, body);
      return { ok: false, error: `resend_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[sendAdminNotification] exception", e);
    return { ok: false, error: "exception" };
  }
}