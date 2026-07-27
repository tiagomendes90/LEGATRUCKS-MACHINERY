# Fase 2.5 — Newsletter (Resend)

Implementar a Newsletter como canal independente do PublishingService, com o mesmo nível de modularidade e rastreabilidade das Fases 2.3/2.4 (Facebook/Instagram). Fluxo 100% manual: o administrador cria a campanha, seleciona produtos, edita o conteúdo, pré-visualiza e só depois confirma o envio.

## 1. Base de dados (migração)

Novas tabelas (todas com RLS admin-only + GRANT authenticated/service_role):

- `newsletter_subscribers`
  - `email` (unique), `first_name`, `last_name`, `status` (`active|unsubscribed|bounced`), `consent` (bool), `subscribed_at`, `unsubscribed_at`, `unsubscribe_token` (uuid), `source` (ex: `footer_form`, `import`, `admin`), `metadata` jsonb.
  - Public INSERT permitido (para o formulário do rodapé), SELECT/UPDATE/DELETE admin.
- `newsletter_campaigns`
  - `title`, `subject`, `preheader`, `status` (`draft|ready|scheduled|sending|sent|failed|canceled`), `product_ids` uuid[], `content_html`, `content_json` jsonb (blocos editáveis + overrides), `template_key` (default `product_showcase_v1`), `scheduled_for`, `sent_at`, `sent_by` (auth uid), `broadcast_id` (Resend), `stats` jsonb (opens/clicks/etc), `created_by`.
- `newsletter_sends` (auditoria por destinatário/lote)
  - `campaign_id`, `subscriber_id` (nullable — Resend audience-based), `channel_key` = `newsletter`, `status` (`queued|sent|failed|bounced|complained|unsubscribed`), `resend_message_id`, `error`, `raw_response` jsonb, `sent_at`.
- Reaproveitar `publishing_events` + `publishing_logs` para orquestração e logs técnicos (o adapter escreve lá como Facebook/Instagram fazem).

Novos event types (adicionar aceites no dispatcher):
- `newsletter.campaign.send` — enviado quando admin confirma o envio.
- `newsletter.campaign.cancel` — cancelar broadcast agendado.

## 2. Adapter `newsletter` (reescrita)

`supabase/functions/_shared/publishing/channels/newsletter.ts` passa a suportar apenas os novos eventos (`newsletter.campaign.*`). Remover o antigo comportamento automático em `product.published` (não deve enviar sem confirmação).

Fluxo `newsletter.campaign.send`:
1. Ler campanha por id (payload contém `campaign_id`).
2. Renderizar HTML final via `renderNewsletterHtml(campaign, products)` (módulo partilhado).
3. Criar broadcast Resend em `RESEND_AUDIENCE_ID` (ou usar API `emails` em lote se `subscriber_ids` for passado — v1 usa Audience).
4. Enviar broadcast; guardar `broadcast_id` em `newsletter_campaigns`.
5. Registar em `newsletter_sends` (1 linha "audience broadcast" enquanto não temos webhook de eventos por destinatário; preparado para expandir).
6. Update campaign `status=sent`, `sent_at`.
7. Retornar `ChannelResult` normal (dispatcher escreve `publishing_logs`).

Isolamento: adapter só reage se `event_type` começar por `newsletter.` — nunca a `product.*`. Sem dependência de outros canais.

## 3. Renderização HTML (módulo partilhado)

`supabase/functions/_shared/publishing/newsletterTemplate.ts`:
- `renderNewsletterHtml({ campaign, products, unsubscribeUrlFor(subscriber) })` retorna HTML responsivo (tabelas inline, largura 600px, dark-mode friendly).
- Blocos: header com logótipo LEGA, intro editável, cards de produto (imagem, título, preço, specs top 3, CTA "Ver produto" com URL canónica `https://www.lega.pt/...`), footer institucional (morada, contactos, ícones sociais, link unsubscribe `{{RESEND_UNSUBSCRIBE_URL}}`).
- Template versionado (`template_key`) para permitir novos formatos sem regressões.
- Reutilizado pelo preview do admin (renderiza no iframe) e pelo adapter.

## 4. Edge Functions

- `newsletter-subscribe` (existente): atualizar para gravar em `newsletter_subscribers` **antes** de sincronizar com Resend Audience. Guarda `unsubscribe_token`. Continua idempotente.
- `newsletter-unsubscribe` (nova): GET `?token=` marca `status=unsubscribed`, `unsubscribed_at=now()`, chama Resend para actualizar contacto. Devolve página HTML simples de confirmação.
- `newsletter-preview` (nova, admin-only via JWT): recebe `campaign_id` ou payload draft e devolve HTML renderizado (para o iframe do admin sem duplicar o renderer no cliente).

## 5. Painel Admin

Novo separador **Newsletter** em `AdminDashboard.tsx` + componente `NewsletterPanel.tsx` com sub-tabs:

1. **Campanhas** — lista com estado, data, produtos, ações (editar, duplicar, cancelar).
2. **Editor de campanha** (`NewsletterCampaignEditor.tsx`):
   - Título interno + `subject` + `preheader`.
   - Seletor multi-produto (`ready_for_social` ou activos) com pesquisa.
   - Intro/outro editáveis (textarea markdown-lite).
   - Overrides por produto (título/descrição/CTA opcionais — guardados em `content_json`).
   - Guardar rascunho / Marcar "Pronto".
   - Preview lado-a-lado em iframe (mobile/desktop toggle) chamando `newsletter-preview`.
   - Botão **Enviar agora** (com modal de confirmação: mostra nº de subscritores activos, subject final) — emite `newsletter.campaign.send` via `emitPublishingEvent`.
3. **Subscritores** — tabela com filtro, contagem por estado, export CSV, botão manual de unsubscribe.
4. **Histórico** — tabela `newsletter_sends` + `publishing_logs` filtrados por `channel_key='newsletter'`, com resposta bruta do Resend (reutiliza `MetaErrorBlock` renomeado/generalizado ou novo `ProviderErrorBlock`).

Hook `useNewsletter.tsx` com queries React Query (`campaigns`, `subscribers`, `sends`) e mutations (`saveDraft`, `markReady`, `sendNow`, `cancel`, `unsubscribe`).

## 6. Fluxo e-2-e

```text
Admin cria campanha -> escolhe produtos -> edita -> Preview -> Enviar agora
   -> INSERT publishing_events (type=newsletter.campaign.send, dedupe_key hash de campaign_id+content_hash)
   -> publish-dispatcher (cron ou push) claim -> newsletter adapter
   -> Resend Broadcasts (create + send)
   -> newsletter_campaigns.status=sent, broadcast_id
   -> publishing_logs + newsletter_sends registados
```

Retries: reutiliza backoff exponencial do dispatcher (6 tentativas). `dedupe_key` impede duplo envio caso o admin carregue duas vezes.

## 7. Segurança / Privacidade

- Todos os writes admin-only via RLS + `is_admin()`.
- `newsletter_subscribers.INSERT` público limitado ao endpoint (não expõe SELECT).
- `unsubscribe_token` uuid v4 imprevisível; endpoint público apenas com token válido.
- Sem PII em `publishing_logs` (só ids + status).

## 8. Fora de âmbito (documentado como recomendação)

- Segmentação/listas múltiplas (schema preparado via `metadata`/tags mas UI não construída).
- Webhooks Resend por destinatário (opens/clicks/bounces) — deixar hook stub em `newsletter_sends`.
- Agendamento futuro (`scheduled_for`) — campo existe, UI só permite "Enviar agora" nesta fase.
- Digest semanal automático — protelado.

## 9. Detalhes técnicos

- **Migração única** com CREATE TABLE + GRANT + RLS + POLICY + triggers `updated_at` + índices em `email`, `campaign_id`, `status`.
- **Renderer** partilhado entre edge functions via `_shared/publishing/newsletterTemplate.ts` (Deno-compatible, sem deps externas — string templating).
- **Preview no frontend** faz `supabase.functions.invoke('newsletter-preview', {...})` e injecta em `<iframe srcDoc>`.
- **Envio Resend** usa endpoint `/broadcasts` (audience-wide). Preparar `sendByEmails(subscriberIds)` como TODO documentado no adapter para envio segmentado futuro sem refactor.
- **Novos secrets já disponíveis**: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_FROM_EMAIL` (pedir add_secret se em falta antes do teste).

## 10. Entregáveis

- 1 migração SQL (tabelas + policies + grants + triggers).
- Adapter reescrito + template partilhado.
- 3 edge functions (subscribe update, unsubscribe, preview).
- `NewsletterPanel` + `NewsletterCampaignEditor` + `useNewsletter` hook.
- Docs: secção nova em `docs/meta-e2e-checklist.md` (ou novo `docs/newsletter-e2e-checklist.md`).
- Relatório técnico final.

Confirma para eu avançar com a implementação (migração primeiro, depois edge functions + frontend).
