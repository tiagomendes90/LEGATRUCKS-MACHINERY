
# Fase 2 — Publicação Automática Multi-Canal

Análise técnica e plano faseado. **Não implementa nada** — apenas desenha, identifica pré-requisitos e riscos.

## 1. Estado atual (o que já existe)

A infraestrutura base foi concluída na Fase 1 e está pronta a receber os canais reais:

- **Tabelas**: `publishing_events` (fila), `publishing_channels` (config on/off), `publishing_logs` (auditoria).
- **Edge function** `publish-dispatcher`: consome eventos, carrega o produto, itera adapters ativos, escreve logs.
- **Contrato `ChannelAdapter`** (`key`, `label`, `supports`, `publish`) — adicionar canal = 1 ficheiro + 1 linha no `registry`.
- **Adapters existentes** (esqueleto funcional, ainda retornam `skipped` sem credenciais):
  - `sitemap.ts` — regenera sitemap
  - `facebook.ts` — chama Graph API `/photos` ou `/feed`
  - `instagram.ts` — fluxo container + publish
  - `newsletter.ts` — Resend Broadcasts (create + send)
- **Front-end**: `emitPublishingEvent()` em `src/lib/publishing.ts`, painel admin `PublishingPanel.tsx`, toggle "Publicar agora" no `ProductForm`.
- **Formatação partilhada**: `_shared/publishing/productFormatting.ts` (caption, subject, HTML do email, URL canónica, imagem primária).

Conclusão: **arquitetura pronta**. A Fase 2 é preencher credenciais, validar fluxos reais das APIs e endurecer o pipeline.

## 2. Arquitetura desejada (visão end-to-end)

```text
Admin guarda produto (published=true, toggle "Publicar agora" ON)
        │
        ▼
emitPublishingEvent({ type: "product.published", productId })
        │
        ├─► INSERT publishing_events (status=pending)
        └─► invoke("publish-dispatcher") (fire-and-forget)
                │
                ▼
        publish-dispatcher
                │
                ├─ load product (+ brand + images)
                ├─ read publishing_channels (enabled)
                │
                ├─► sitemap.publish()     → regenera sitemap.xml (webhook Vercel)
                ├─► facebook.publish()    → Graph API /{PAGE_ID}/photos
                ├─► instagram.publish()   → /{IG_ID}/media + /media_publish
                └─► newsletter.publish()  → Resend /broadcasts + /send
                │
                ▼
        INSERT publishing_logs (por canal: success|failed|skipped)
        UPDATE publishing_events.status
```

Princípios mantidos: **event-driven**, **adapters plugáveis**, **idempotência via logs**, **falha isolada por canal**, **config via `publishing_channels` + secrets**.

## 3. Pré-requisitos técnicos por canal

### 3.1 Facebook Page
- App Meta em modo **Live** (Business verificado).
- Página Facebook da LEGA + admin da app ligado à página.
- Permissões: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`.
- **Page Access Token de longa duração** (60 dias → trocar por token permanente via `/me/accounts`).
- Secrets: `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`.
- Imagens **públicas e acessíveis por URL absoluto https** (já garantido pelo bucket `product-images` público).

### 3.2 Instagram Business
- Conta IG **Business ou Creator** ligada à Página Facebook acima.
- Permissões: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`.
- Fluxo em 2 passos: `POST /{ig-user-id}/media` (cria container) → `POST /{ig-user-id}/media_publish`.
- Imagem: 1 URL público https, JPEG, ratio 4:5–1.91:1, ≥320px, <8MB.
- Caption: máx 2200 chars, máx 30 hashtags.
- Secrets: `META_IG_BUSINESS_ID` (o mesmo token da Página serve).
- Limite: **25 posts / conta IG / 24h**.

### 3.3 Newsletter (Resend Audiences) — já ligado via connector
- Connector Resend já ativo → `RESEND_API_KEY` disponível como env var.
- Necessário: **domínio verificado no Resend** (SPF, DKIM, DMARC) — sender ex.: `newsletter@lega.pt`.
- Criar **Audience** no Resend → copiar `audience_id`.
- Endpoint `newsletter-subscribe` já existe (adiciona contactos à audience via double opt-in).
- Secrets adicionais: `RESEND_AUDIENCE_ID`, `RESEND_FROM_EMAIL`.
- Template HTML: reutiliza `buildProductEmailHtml()` (produto + CTA + link canónico + unsubscribe automático da Resend).
- Requisito legal (RGPD): link de unsubscribe (Resend injeta), consentimento registado, política de privacidade referenciada.

### 3.4 Sitemap
- Regeneração dupla:
  1. **Webhook Vercel Deploy Hook** — invalida build → `scripts/generate-sitemap.ts` corre e publica `/sitemap.xml`.
  2. Alternativa leve: gerar sitemap dinâmico via edge function `sitemap-xml` (evita rebuild completo).
- Secret opcional: `VERCEL_DEPLOY_HOOK_URL`.
- Ping ao Google/Bing (`/ping?sitemap=…`) — opcional, baixo valor hoje.

## 4. Plano faseado (implementação)

Cada sub-fase é independente e testável isoladamente. Só se avança para a seguinte quando a anterior estiver validada em produção.

### Fase 2.0 — Endurecimento do dispatcher (1 dia)
Prep antes de ligar APIs reais:
- Locking otimista no evento (`status=pending → processing`) para evitar dupla execução se o cron e o invoke concorrem.
- Retries com backoff (até 3 tentativas por canal, `attempts` já existe).
- Deduplicação: `UNIQUE (event_id, channel_key, status='success')` — nunca publicar 2× o mesmo produto no mesmo canal.
- `pg_cron` a cada 5min a chamar o dispatcher para apanhar `pending`/`failed`.
- Alerta admin (via `sendAdminNotification`) quando um evento falha 3× consecutivas.

### Fase 2.1 — Sitemap automático (0.5 dia)
Menor risco, sem credenciais externas complexas:
- Ligar Vercel Deploy Hook.
- Testar publicação de produto → sitemap atualiza em < 2min.
- Validar no Google Search Console.

### Fase 2.2 — Newsletter Resend (1–2 dias)
- Verificar domínio `lega.pt` no Resend (DNS: SPF + DKIM + DMARC).
- Criar Audience e obter `RESEND_AUDIENCE_ID`.
- Adicionar secrets, ativar canal em `publishing_channels`.
- Publicar produto de teste → email de teste a audience interna (1–2 emails).
- Validar renderização em Gmail, Outlook, Apple Mail, mobile.
- **Só depois** abrir subscrições públicas no footer.

### Fase 2.3 — Facebook Page (1–2 dias)
- Criar app Meta, verificar negócio, adicionar produto Facebook Login + Pages API.
- Gerar Page Access Token permanente (via Graph API Explorer → `/me/accounts`).
- Adicionar secrets, ativar canal.
- Publicar produto de teste, validar post na página, engagement e link clicável.

### Fase 2.4 — Instagram Business (2–3 dias, o mais complexo)
- Converter conta IG em Business e ligar à Página FB.
- Reutilizar mesmo Page Access Token com scopes IG.
- Obter `ig-user-id` via `/{page-id}?fields=instagram_business_account`.
- Implementar fluxo container + publish com polling do `status_code` (`FINISHED` antes de publicar).
- Publicar produto de teste, validar imagem, caption e hashtags.

### Fase 2.5 — Observabilidade e resiliência (1 dia)
- Painel admin: filtros por canal/status, botão "Reenviar" por canal individual (não só por evento inteiro).
- Métricas: taxa de sucesso por canal últimos 30 dias.
- Notificação email quando quota Meta/Resend >80%.

### Fase 2.6 (futuro, fora desta fase) — extensões
LinkedIn Company Page, WhatsApp Business, X/Twitter, Google Business Profile — **cada uma = 1 novo adapter**, sem tocar no dispatcher.

## 5. Riscos e limitações identificados

| Risco | Severidade | Mitigação |
|---|---|---|
| Page Access Token expira (60d se não permanente) | Alta | Trocar por token permanente logo no setup + alerta 7d antes de expirar |
| Meta App em modo Development → só posta para admins | Alta | Submeter para App Review antes de Fase 2.3 |
| IG rate limit 25 posts/24h | Média | Baixo volume atual (< 5/dia); adicionar guard no adapter |
| Imagem do produto inacessível publicamente | Média | Já mitigado (bucket público); validar HEAD antes de enviar |
| Email como spam por domínio não verificado | Alta | SPF+DKIM+DMARC obrigatórios antes de Fase 2.2 |
| Publicação duplicada em edição de produto | Média | Toggle "Publicar agora" default OFF (já feito) + dedup constraint |
| Falha silenciosa (fire-and-forget do frontend) | Média | Cron + retries + notificação admin em 3 falhas |
| RGPD: envio a subscritor sem consentimento | Alta | Double opt-in obrigatório (endpoint já existe) + registo de consentimento |
| Meta muda versão da Graph API | Baixa | Pinning `v19.0` explícito + revisão trimestral |
| Regressão: publicar em rascunho por erro | Média | Guard no dispatcher: só processar se `product.published=true` no momento do processamento |

## 6. Decisões que precisam de confirmação antes de começar

1. **Sitemap**: rebuild Vercel (deploy completo) ou edge function dinâmica (mais rápido, mas não pré-renderiza)?
2. **Instagram**: só imagem única, ou também carrossel quando o produto tem >1 foto?
3. **Newsletter**: envio imediato ao publicar, ou digest semanal com os novos produtos da semana? (Digest reduz risco de spam e cansaço do subscritor.)
4. **Domínio de envio**: confirmar `newsletter@lega.pt` como remetente e disponibilidade para configurar DNS.
5. **App Review Meta**: quem gere a conta Meta Business da LEGA? O processo demora 3–7 dias úteis e é bloqueante para 2.3 e 2.4.

## 7. Resultado esperado no fim da Fase 2

- Publicar um veículo no admin (com toggle ON) dispara automaticamente: post FB + post IG + email newsletter + sitemap atualizado, **sem intervenção manual**.
- Admin vê estado por canal e pode reprocessar falhas.
- Adicionar um novo canal (LinkedIn, WhatsApp) = 1 ficheiro, zero mudanças no core.
- Zero credenciais em código; tudo em Supabase Secrets ou `publishing_channels.config`.
