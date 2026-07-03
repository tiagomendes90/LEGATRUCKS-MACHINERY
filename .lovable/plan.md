# PublishingService — Arquitetura modular de publicação

Serviço único que centraliza todas as integrações externas (Facebook, Instagram, Newsletter, Sitemap e futuros canais) através de um padrão orientado a eventos. Espelha a filosofia já adotada em `submit-form` / `useSubmitForm`: um único ponto de entrada, adaptadores intermutáveis, zero duplicação.

## Princípios

1. **Event-driven** — o código de negócio (admin) apenas emite um evento (`product.published`, `product.updated`, `product.unpublished`). Não conhece os canais.
2. **Adaptadores plugáveis** — cada canal implementa a mesma interface (`ChannelAdapter`). Adicionar LinkedIn/WhatsApp = criar um ficheiro, registá-lo no `channels/index.ts`. Zero alterações no fluxo principal.
3. **Idempotente e auditável** — cada tentativa fica registada em BD com estado (`pending/success/failed/skipped`), payload e erro. Permite reprocessar sem duplicar.
4. **Assíncrono e resiliente** — falha num canal não bloqueia os outros nem a UI. Retries controlados.
5. **Config-driven** — cada canal pode ser ligado/desligado no painel admin sem deploy.

## Fluxo

```text
Admin guarda produto
        │
        ▼
DB trigger OR client call
        │
        ▼
enqueue publishing_events (tipo, product_id, payload)
        │
        ▼
Edge Function: publish-dispatcher
        │
        ├── loop pelos ChannelAdapters ativos
        │      ├── facebook.publish(product)  ─► log
        │      ├── instagram.publish(product) ─► log
        │      ├── newsletter.queue(product)  ─► log
        │      └── sitemap.regenerate()       ─► log
        │
        ▼
publishing_logs (auditoria + estado por canal)
```

## Modelo de dados (nova migração)

- `publishing_events` — fila de eventos: `id, event_type, product_id, payload jsonb, status, created_at, processed_at`.
- `publishing_channels` — configuração: `key (facebook|instagram|newsletter|sitemap|…), enabled bool, config jsonb, updated_at`.
- `publishing_logs` — auditoria: `id, event_id, channel_key, status (success|failed|skipped), request jsonb, response jsonb, error text, attempts int, created_at`.

RLS: leitura/escrita restrita a admin (`is_admin()`); `service_role` acesso total (edge functions).

## Estrutura de ficheiros

```text
supabase/functions/
  publish-dispatcher/index.ts        # ponto único; lê fila, delega a adapters
  _shared/publishing/
    types.ts                         # ChannelAdapter, PublishingEvent, PublishingContext
    registry.ts                      # regista adapters ativos
    logger.ts                        # escreve publishing_logs
    channels/
      facebook.ts
      instagram.ts
      newsletter.ts
      sitemap.ts
      index.ts                       # exporta lista
src/
  hooks/usePublishingChannels.tsx    # admin: liga/desliga canais
  components/admin/PublishingPanel.tsx  # UI de configuração + histórico
  lib/publishing.ts                  # helper front: emitPublishingEvent()
```

## Interface de adaptador

```ts
export interface ChannelAdapter {
  key: string;                                    // "facebook"
  label: string;
  supports: (event: PublishingEvent) => boolean;  // ex.: só reage a product.published
  publish: (ctx: PublishingContext) => Promise<ChannelResult>;
}
```

Adicionar LinkedIn = criar `channels/linkedin.ts` + registá-lo em `channels/index.ts`. Nada mais muda.

## Integração com o admin (mínima)

- No `ProductForm` (ao guardar) e no toggle de publicação: chamar `emitPublishingEvent({ type: "product.published", productId })`. Uma linha.
- Novo separador **"Publicação"** no admin dashboard com:
  - Tabela de canais (toggle enabled, editar config JSON).
  - Histórico dos últimos eventos com estado por canal + botão "Reenviar".

## Canais nesta fase (stubs funcionais)

- **Sitemap** — regenera `sitemap.xml` (integra-se com o script existente ou chama endpoint).
- **Facebook / Instagram / Newsletter** — adapters criados com contrato completo mas `publish()` devolve `skipped` enquanto credenciais/templates não estiverem configurados. Fase 2 preenche.

Assim a arquitetura fica 100% pronta e testável; ligar cada canal real torna-se trabalho isolado.

## Anti-duplicação com o que já existe

- Reusa `_shared/sendAdminNotification.ts` (o Newsletter adapter pode usá-lo para notificar admin).
- Reusa o padrão `_shared/antiSpam.ts` como referência de organização.
- Não toca em `submit-form` nem em `contact_messages`.

## Fora do âmbito desta iteração

- Implementação real das APIs Facebook/Instagram/Mailchimp (Fase 2, cada canal isolado).
- OAuth Meta / gestão de tokens de longa duração (só quando ligarmos o canal real).
- Cron automático (adiciona-se depois via `pg_cron` chamando `publish-dispatcher`).

## Detalhes técnicos

- Dispatcher pode ser acionado por: (a) chamada direta do frontend após `emitPublishingEvent`; (b) futuramente `pg_cron` a cada minuto para retries.
- Retries: até 3 tentativas por canal com backoff exponencial guardado em `attempts`.
- Config sensível (tokens API) fica em Supabase Secrets, nunca em `publishing_channels.config`.
- Tipos TS partilhados entre front e edge via `_shared/publishing/types.ts` re-exportado.

## Resultado

Depois desta iteração:
- Publicar/atualizar um produto dispara automaticamente todos os canais ativos.
- Adicionar LinkedIn/WhatsApp/qualquer canal futuro = 1 ficheiro novo, 1 linha no registry.
- Admin vê e re-tenta qualquer publicação falhada.
- Zero duplicação com o pipeline de formulários já unificado.
