
# Fase 2 — Publicação Automática Multi-Canal (v2, ajustada)

Análise técnica e plano faseado. **Não implementa nada** — apenas desenha, identifica pré-requisitos e riscos.

## 1. Estado atual (o que já existe)

Infraestrutura base concluída na Fase 1:

- **Tabelas**: `publishing_events` (fila), `publishing_channels` (config on/off), `publishing_logs` (auditoria).
- **Edge function** `publish-dispatcher`: consome eventos, carrega o produto, itera adapters ativos, escreve logs.
- **Contrato `ChannelAdapter`** (`key`, `label`, `supports`, `publish`) — adicionar canal = 1 ficheiro + 1 linha no `registry`.
- **Adapters existentes** (esqueleto, ainda retornam `skipped` sem credenciais): `sitemap`, `facebook`, `instagram`, `newsletter`.
- **Front-end**: `emitPublishingEvent()`, `PublishingPanel.tsx`, toggle "Publicar agora" no `ProductForm`.
- **Formatação partilhada** em `_shared/publishing/productFormatting.ts`.

Conclusão: **arquitetura pronta**. A Fase 2 preenche credenciais, endurece pipeline e afina cada canal.

## 2. Ajustes de arquitetura (decisões confirmadas)

1. **Sitemap dinâmico via Edge Function** — não usar rebuild Vercel. Nova função `sitemap-xml` serve `/sitemap.xml` em tempo real a partir do Supabase, com cache HTTP curto (`Cache-Control: public, max-age=300, s-maxage=600`) e rewrite no `vercel.json` para `/sitemap.xml → /functions/v1/sitemap-xml`. O adapter `sitemap` deixa de "regenerar" e passa a apenas **invalidar cache** e fazer **ping** a motores de pesquisa (ver §2.4).
2. **Instagram adaptativo**:
   - 1 imagem → post single (`media_type=IMAGE`).
   - ≥2 imagens → carrossel (`media_type=CAROUSEL`): criar N children containers + 1 container `CAROUSEL` com `children=[ids]` → `media_publish`.
   - Máx 10 imagens (limite Meta); ordenar pela `sort_order` das `product_images`.
3. **Newsletter em digest semanal**:
   - Adapter `newsletter` deixa de enviar por evento; apenas **acumula** produtos publicados na semana (via query direta a `products.published_at` dentro do intervalo, não requer estado adicional).
   - Nova edge function `newsletter-weekly-digest` corre via `pg_cron` (ex.: quinta-feira 10:00 Europe/Lisbon), agrega produtos da semana, envia broadcast único.
   - Campanhas manuais continuam possíveis: novo tipo de evento `newsletter.manual` com payload `{ subject, html, product_ids? }` — o adapter reage a este evento no mesmo pipeline.
4. **Remetente**: `newsletter@lega.pt` (From) + `info@lega.pt` (Reply-To). Secrets: `RESEND_FROM_EMAIL=newsletter@lega.pt`, `RESEND_REPLY_TO=info@lega.pt`.
5. **Novo estado `scheduled`** no pipeline (ver §2.3) — suporta agendamento futuro de qualquer canal sem alterar o dispatcher.
6. **Preparação para motores de pesquisa** como canais nativos: `indexnow` (Bing, Yandex, DuckDuckGo, Seznam) e `google-indexing` (via Indexing API — hoje só suporta JobPosting e BroadcastEvent oficialmente, útil como stub) — mais detalhe em §2.4.

### 2.1 Novos tipos de evento

```ts
type PublishingEventType =
  | "product.published"
  | "product.updated"
  | "product.unpublished"
  | "newsletter.manual"      // campanha manual ad-hoc
  | "digest.weekly";         // disparado pelo cron do digest
```

Adapters filtram via `supports(event)` — zero alterações no dispatcher.

### 2.2 Fluxo end-to-end

```text
Admin publica produto (toggle ON)
  → emitPublishingEvent("product.published", productId)
       → INSERT publishing_events (status=pending | scheduled se scheduled_for>now)
       → invoke publish-dispatcher (só se pending)
              → sitemap.publish()    → invalida cache + ping IndexNow/Google
              → facebook.publish()   → Graph API /photos
              → instagram.publish()  → single OU carousel conforme nº imagens
              → newsletter.publish() → SKIPPED em product.published (só reage a digest.weekly + newsletter.manual)

pg_cron semanal (Qui 10:00 WET)
  → invoke newsletter-weekly-digest
       → agrega produtos da semana
       → INSERT publishing_events (type=digest.weekly, payload={product_ids})
       → dispatcher → newsletter.publish() → Resend broadcast

pg_cron cada 5min
  → invoke publish-dispatcher (sem event_id)
       → processa pending + failed(<3 attempts) + scheduled(scheduled_for<=now)
```

### 2.3 Estado `scheduled` no pipeline

Alterações mínimas em `publishing_events`:

```sql
ALTER TABLE publishing_events
  ADD COLUMN scheduled_for TIMESTAMPTZ,
  ADD COLUMN attempts INT NOT NULL DEFAULT 0;

-- status passa a aceitar: pending | scheduled | processing | completed | failed
```

Regras no dispatcher:
- `emitPublishingEvent({ scheduledFor })` → INSERT com `status='scheduled'` e não invoca dispatcher.
- Cron: `WHERE status='pending' OR (status='scheduled' AND scheduled_for <= now()) OR (status='failed' AND attempts < 3)`.
- UI admin: date-time picker opcional junto ao toggle "Publicar agora" → "Agendar para…".

### 2.4 Canal `search-engines` (novo, preparado)

Adapter único que encapsula sub-providers, extensível sem novo canal por motor:

```
_shared/publishing/channels/searchEngines/
  index.ts           # adapter agregador
  indexnow.ts        # POST https://api.indexnow.org/indexnow
  googleIndexing.ts  # stub — só JobPosting/BroadcastEvent oficialmente
  bingWebmaster.ts   # opcional, via API key Bing
```

- IndexNow: requer chave gerada + ficheiro `/{key}.txt` público na raiz do site (servível via edge function `indexnow-key`).
- Google Indexing API: requer Service Account + Search Console; para páginas normais o valor é limitado — manter como stub e priorizar submissão de sitemap no Search Console.
- Sitemap ping legacy (`google.com/ping?sitemap=`) foi **desativado pela Google em 2023** — não implementar.

## 3. Pré-requisitos técnicos por canal

### 3.1 Facebook Page
- App Meta em modo **Live**, Business verificado, admin ligado à Página.
- Permissões: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`.
- **Page Access Token permanente** (via `/me/accounts` a partir de user token long-lived).
- Secrets: `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`.

### 3.2 Instagram Business (single + carrossel)
- Conta IG Business/Creator ligada à Página FB.
- Permissões: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`.
- Fluxo single: `POST /{ig-id}/media` (image_url + caption) → poll `status_code=FINISHED` → `POST /{ig-id}/media_publish`.
- Fluxo carrossel: N × `POST /{ig-id}/media` (is_carousel_item=true) → `POST /{ig-id}/media` (media_type=CAROUSEL, children=[ids]) → publish.
- Imagens: JPEG público https, ratio 4:5–1.91:1, ≥320px, <8MB, máx 10 no carrossel.
- Caption: 2200 chars, 30 hashtags.
- Secrets: `META_IG_BUSINESS_ID`.
- Rate limit: 25 posts/24h por conta IG (carrossel conta como 1).

### 3.3 Newsletter (Resend Audiences + digest semanal)
- Connector Resend já ativo (`RESEND_API_KEY` disponível).
- Domínio `lega.pt` verificado no Resend (SPF, DKIM, DMARC).
- Sender confirmado: **From `newsletter@lega.pt`, Reply-To `info@lega.pt`**.
- Audience: criar "LEGA Newsletter" no Resend → `RESEND_AUDIENCE_ID`.
- Double opt-in via endpoint `newsletter-subscribe` já existente.
- Digest semanal: agregação por `products.published_at BETWEEN now()-7d AND now() AND published=true`, ordenado por data desc.
- Template digest: título "Novidades da semana na LEGA", grid 1–2 col com foto + título + preço + link canónico + CTA.
- Campanha manual: painel admin com editor (subject + HTML + seleção opcional de produtos para injetar automaticamente).
- Secrets: `RESEND_AUDIENCE_ID`, `RESEND_FROM_EMAIL=newsletter@lega.pt`, `RESEND_REPLY_TO=info@lega.pt`.

### 3.4 Sitemap dinâmico
- Nova edge function `sitemap-xml`: gera XML on-the-fly (produtos publicados + páginas estáticas + categorias) com `lastmod=updated_at`.
- Cache: `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=86400`.
- Rewrite Vercel: `{ "source": "/sitemap.xml", "destination": "https://dzljzvkshlgnmwpvweas.supabase.co/functions/v1/sitemap-xml" }`.
- Remover `public/sitemap.xml` estático e `scripts/generate-sitemap.ts` do fluxo de build.
- `robots.txt` continua a apontar para `https://lega.pt/sitemap.xml`.

### 3.5 IndexNow (preparado, ativar em 2.5)
- Gerar chave (UUID sem hífens) → guardar em secret `INDEXNOW_KEY`.
- Servir `/{INDEXNOW_KEY}.txt` via edge function `indexnow-key` (rewrite em `vercel.json`).
- Ping `POST https://api.indexnow.org/indexnow` com `{ host, key, keyLocation, urlList: [productUrl] }` em cada `product.published`/`product.updated`.

## 4. Plano faseado

### Fase 2.0 — Endurecimento do dispatcher + estado `scheduled` (1 dia)
- Migração: adiciona `scheduled_for`, `attempts`, expande `status` para incluir `scheduled`.
- Lock otimista `pending→processing` (UPDATE … WHERE status='pending' RETURNING).
- Retries com backoff exponencial (base 2min, máx 3 tentativas).
- Dedup: `UNIQUE INDEX (event_id, channel_key) WHERE status='success'` em `publishing_logs`.
- `pg_cron` a cada 5min invoca `publish-dispatcher`.
- Guard: só processa `product.published` se `products.published=true` no momento.
- Alerta admin após 3 falhas via `sendAdminNotification`.

### Fase 2.1 — Sitemap dinâmico + IndexNow foundation (0.5 dia)
- Criar edge function `sitemap-xml` + rewrite.
- Refactor adapter `sitemap` → invalida cache CDN (cabeçalho `Cache-Purge` opcional) + prepara payload para IndexNow.
- Gerar `INDEXNOW_KEY`, criar edge function `indexnow-key`, rewrite.
- Ativar canal `search-engines` (subprovider IndexNow) no `publishing_channels`.
- Validar `/sitemap.xml` no Google Search Console + submeter URL no IndexNow.

### Fase 2.2 — Newsletter Resend digest semanal (2 dias)
- Verificar DNS de `lega.pt` no Resend.
- Criar Audience, capturar `RESEND_AUDIENCE_ID`.
- Adicionar secrets (`RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, `RESEND_AUDIENCE_ID`).
- Refactor `newsletter.ts`: `supports` reage a `digest.weekly` + `newsletter.manual` (não a `product.published`).
- Nova edge function `newsletter-weekly-digest` (agregação + enqueue evento `digest.weekly`).
- `pg_cron` semanal (Qui 10:00 Europe/Lisbon) invoca a função.
- Painel admin: nova secção "Newsletter" com preview do próximo digest + botão "Enviar campanha manual".
- Teste com audience interna antes de abrir subscrições públicas.

### Fase 2.3 — Facebook Page (1–2 dias)
- App Meta em Live, App Review para `pages_manage_posts`.
- Gerar Page Access Token permanente.
- Adicionar secrets, ativar canal.
- Publicar produto de teste, validar post + link + engagement.

### Fase 2.4 — Instagram Business single + carrossel (2–3 dias)
- Conta IG Business ligada à Página.
- Obter `META_IG_BUSINESS_ID` via `/{page-id}?fields=instagram_business_account`.
- Implementar branching single vs carrossel no adapter.
- Polling de `status_code` com timeout (30s por container).
- Guard rate limit 25/24h consultando `publishing_logs` do próprio canal.
- Testes: produto com 1 foto e produto com 5 fotos.

### Fase 2.5 — Search engines completos + observabilidade (1 dia)
- Ativar IndexNow em produção (ping em cada publicação/atualização).
- Google Indexing API: manter stub, documentar limitação.
- Painel admin: filtros por canal/status, retry por canal individual, métricas 30d, agendador (date-time picker).
- Alertas de quota Meta/Resend >80%.

### Fase 2.6 (futuro) — extensões
LinkedIn Company Page, WhatsApp Business Cloud API, X/Twitter, Google Business Profile, TikTok Business — cada canal = 1 adapter novo.

## 5. Riscos e limitações

| Risco | Severidade | Mitigação |
|---|---|---|
| Page Access Token expira (60d se não permanente) | Alta | Token permanente + alerta 7d antes de expirar |
| Meta App em Development → só posta para admins | Alta | App Review antes de 2.3 |
| IG rate limit 25 posts/24h | Média | Guard no adapter consultando logs 24h |
| Carrossel IG: 1 imagem inválida falha o post inteiro | Média | Validar HEAD + dimensões antes de criar containers; fallback single |
| Sitemap dinâmico: latência edge function | Baixa | Cache HTTP 5–10min + SWR 24h |
| Digest sem novidades na semana | Baixa | Skip envio se `product_ids` vazio (log `skipped`) |
| Email como spam | Alta | SPF+DKIM+DMARC + domínio aquecido (começar com audience pequena) |
| Publicação duplicada em edição | Média | Toggle default OFF + dedup constraint |
| Falha silenciosa (fire-and-forget) | Média | Cron + retries + notificação admin em 3 falhas |
| RGPD sem consentimento | Alta | Double opt-in obrigatório + registo de consentimento + link unsubscribe |
| Google Indexing API não indexa páginas normais | Baixa | Confiar em sitemap + IndexNow; API só como stub |
| Cron falha silenciosa | Média | Logar execução em `publishing_logs` (channel_key='cron') |
| Timezone do digest | Baixa | Cron em UTC ajustado (`0 9 * * 4` = 10:00 WET / 11:00 WEST — usar UTC 09:00 e aceitar desvio horário) |

## 6. Resultado esperado no fim da Fase 2

- Publicar veículo (toggle ON) dispara automaticamente: post FB + post IG (single ou carrossel) + IndexNow + sitemap dinâmico sempre atualizado.
- Newsletter enviada em digest semanal automático + campanhas manuais on-demand.
- Suporte a agendamento (`scheduled_for`) em qualquer canal, sem alterar o dispatcher.
- Adicionar novo canal (LinkedIn, WhatsApp) ou novo motor de pesquisa = 1 ficheiro, zero mudanças no core.
- Zero credenciais em código; tudo em Supabase Secrets ou `publishing_channels.config`.
