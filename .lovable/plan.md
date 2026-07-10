
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
7. **Separação website ↔ redes sociais** (novo): publicar no website **não** publica automaticamente em FB/IG. O produto entra em estado `ready_for_social` e aguarda confirmação explícita do admin, que pré-visualiza e edita o caption gerado antes de confirmar.
8. **Persistência de identificadores externos** (novo): cada publicação num canal guarda `external_id` + `external_url` (post ID FB, media ID IG, broadcast ID Resend) para consulta, edição, republicação ou remoção futura.
9. **Edições simples não republicam** (novo): `product.updated` deixa de disparar FB/IG automaticamente. Só `social.publish.confirmed` (ação explícita do admin) dispara redes sociais. Sitemap/IndexNow continuam automáticos em qualquer alteração.
10. **Fast-track newsletter** (novo): produtos marcados como `Destaque`, `Novidade` ou `Promoção` podem ser enviados imediatamente por decisão explícita do admin (`newsletter.instant`), mantendo o digest semanal como default.
11. **Métricas por publicação** (novo): tabela dedicada para snapshots periódicos de likes/comments/reach/clicks por canal, alimentada por job de refresh.

### 2.1 Novos tipos de evento

```ts
type PublishingEventType =
  | "product.published"
  | "product.updated"
  | "product.unpublished"
  | "social.publish.confirmed"   // admin confirmou publicação FB+IG (após preview/edit)
  | "social.republish"           // republicar uma publicação existente (usa external_ids)
  | "social.delete"              // remover post FB/IG usando external_id
  | "newsletter.manual"      // campanha manual ad-hoc
  | "newsletter.instant"     // envio imediato p/ Destaque/Novidade/Promoção
  | "digest.weekly";         // disparado pelo cron do digest
```

Adapters filtram via `supports(event)` — zero alterações no dispatcher.

### 2.2 Fluxo end-to-end

```text
Admin publica no website (toggle ON)
  → emitPublishingEvent("product.published", productId)
       → sitemap.publish()   → invalida cache + IndexNow
       → facebook/instagram  → SKIPPED (aguardam confirmação explícita)
       → produto passa a social_status='ready_for_social' + caption gerado auto

Admin abre painel "Pronto para Publicação"
  → pré-visualiza post (imagem principal + caption editável + hashtags + link)
  → edita caption / seleciona imagens / escolhe canais (FB e/ou IG)
  → confirma → emitPublishingEvent("social.publish.confirmed", productId, { caption, image_ids, channels })
       → facebook.publish()   → guarda external_id + external_url em product_social_posts
       → instagram.publish()  → single ou carrossel; guarda ids/urls
       → produto passa a social_status='published'

Admin edita preço/descrição do veículo
  → emitPublishingEvent("product.updated")
       → sitemap + IndexNow apenas (FB/IG skipped)
       → UI mostra badge "alterado desde última publicação social" com opção "Republicar" (=> social.republish)

Admin marca produto como Destaque/Novidade/Promoção e escolhe "Enviar já"
  → emitPublishingEvent("newsletter.instant", productId)
       → newsletter.publish() → envio imediato para audience (com override de template)

pg_cron semanal (Qui 10:00 WET)
  → invoke newsletter-weekly-digest
       → agrega produtos da semana
       → INSERT publishing_events (type=digest.weekly, payload={product_ids})
       → dispatcher → newsletter.publish() → Resend broadcast

pg_cron cada 5min
  → invoke publish-dispatcher (sem event_id)
       → processa pending + failed(<3 attempts) + scheduled(scheduled_for<=now)

pg_cron cada 6h
  → invoke publishing-metrics-refresh
       → varre product_social_posts ativos → Graph API insights → INSERT publishing_metrics snapshot
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

### 2.3.b Estado social do produto + persistência de posts

```sql
ALTER TABLE products
  ADD COLUMN social_status TEXT NOT NULL DEFAULT 'not_ready',
  -- not_ready | ready_for_social | published | outdated | failed
  ADD COLUMN social_caption TEXT,          -- caption editado/aprovado pelo admin
  ADD COLUMN social_caption_auto TEXT,     -- caption gerado automaticamente (referência)
  ADD COLUMN social_last_published_at TIMESTAMPTZ,
  ADD COLUMN social_hash TEXT;             -- hash dos campos-chave (título/preço/desc/imagens)
                                           -- para detetar "outdated" após product.updated

CREATE TABLE public.product_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  channel_key TEXT NOT NULL,               -- 'facebook' | 'instagram' | 'newsletter'
  external_id TEXT NOT NULL,               -- FB post id / IG media id / Resend broadcast id
  external_url TEXT,                       -- permalink público
  caption TEXT,
  media JSONB NOT NULL DEFAULT '[]',       -- URLs enviadas, ordem
  status TEXT NOT NULL DEFAULT 'live',     -- live | deleted | failed
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_response JSONB NOT NULL DEFAULT '{}',
  UNIQUE (channel_key, external_id)
);

CREATE TABLE public.publishing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id UUID NOT NULL REFERENCES public.product_social_posts(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  likes INT, comments INT, shares INT, reach INT, impressions INT, clicks INT,
  raw JSONB NOT NULL DEFAULT '{}'
);
```

Regras:
- `social.publish.confirmed` → INSERT em `product_social_posts` (uma linha por canal) → UPDATE `products.social_status='published'` + `social_last_published_at=now()` + `social_hash=<hash atual>`.
- `product.updated` → recalcula `social_hash`; se diferir do guardado e `social_status='published'` → passa a `outdated` (UI destaca "Republicar").
- `social.republish` recebe `product_social_posts.id[]` (ou canais) → edita/recria via Graph API; para FB usa edit (mantém URL); para IG apaga + recria (IG não suporta edit de media).
- `social.delete` chama Graph API `DELETE /{external_id}` + marca `status='deleted'`.
- Painel admin lista posts existentes com contadores de métricas (última snapshot).

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
- Migração paralela: novas colunas `social_*` em `products`, tabelas `product_social_posts` e `publishing_metrics` (com GRANTs + RLS admin-only).
- Emissão `product.published` deixa de acionar FB/IG (adapters `supports()` ignoram); passam a reagir apenas a `social.publish.confirmed` / `social.republish`.

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
- Botão "Enviar já" no editor do produto (visível apenas se `is_featured` OU `is_new` OU `is_promo`) → emite `newsletter.instant`.
- Teste com audience interna antes de abrir subscrições públicas.

### Fase 2.3 — Painel "Pronto para Publicação" + Facebook (2 dias)
- Novo separador no admin: lista produtos com `social_status='ready_for_social'` ou `outdated`.
- Ecrã de preview: mockup FB/IG, caption editável (auto gerado via `productFormatting` — título, ano, km, preço, hashtags, link canónico), seleção de imagens (ordem drag-and-drop), toggle canais FB/IG.
- Botão "Confirmar publicação" → `social.publish.confirmed`.
- Facebook adapter: Graph API `/photos` (single) ou `/feed` com link; guarda `post_id` + `permalink_url` em `product_social_posts`.
- App Meta em Live, App Review para `pages_manage_posts`, Page Access Token permanente, secrets.

### Fase 2.4 — Instagram single + carrossel + republicação (2–3 dias)
- Conta IG Business ligada à Página.
- Obter `META_IG_BUSINESS_ID` via `/{page-id}?fields=instagram_business_account`.
- Implementar branching single vs carrossel no adapter.
- Polling de `status_code` com timeout (30s por container).
- Guard rate limit 25/24h consultando `publishing_logs` do próprio canal.
- Guardar `ig_media_id` + `permalink` em `product_social_posts`.
- Implementar `social.republish` (FB=edit, IG=delete+recreate) e `social.delete`.
- Testes: produto com 1 foto e produto com 5 fotos.

### Fase 2.5 — Search engines + métricas + observabilidade (1.5 dias)
- Ativar IndexNow em produção (ping em cada publicação/atualização).
- Google Indexing API: manter stub, documentar limitação.
- Nova edge function `publishing-metrics-refresh` (`pg_cron` 6h): FB `/{post-id}?fields=likes.summary(true),comments.summary(true),shares`, IG `/{media-id}/insights?metric=reach,impressions,likes,comments,saved`.
- Painel: por post → gráfico de métricas 30d.
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
| IG não permite editar media | Média | `social.republish` em IG = delete + recreate; avisar admin que URL muda |
| Fast-track abusar do envio | Média | Rate limit por audience (máx 1 instant/dia) + confirmação dupla no admin |
| Métricas Graph API rate-limited | Baixa | Refresh 6h com backoff; snapshot apenas de posts <90 dias |
| Caption editado divergir do produto real | Baixa | Guardar `social_hash` no momento da publicação; badge "outdated" quando produto muda |

## 6. Resultado esperado no fim da Fase 2

- Publicar veículo no website atualiza sitemap + IndexNow automaticamente; publicação em FB/IG requer confirmação explícita com preview e caption editável.
- Cada publicação social guarda `external_id` + `external_url` + snapshots de métricas — permite consultar, editar, republicar ou apagar.
- Edições simples ao produto não republicam nas redes sociais; UI sinaliza "outdated" e oferece republicação 1-clique.
- Newsletter em digest semanal automático + envio imediato opcional para Destaque/Novidade/Promoção + campanhas manuais on-demand.
- Suporte a agendamento (`scheduled_for`) em qualquer canal, sem alterar o dispatcher.
- Adicionar novo canal (LinkedIn, WhatsApp) ou novo motor de pesquisa = 1 ficheiro, zero mudanças no core.
- Zero credenciais em código; tudo em Supabase Secrets ou `publishing_channels.config`.
