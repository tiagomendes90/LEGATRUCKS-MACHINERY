# Checklist E2E — Validação Meta (Facebook + Instagram)

Validação completa dos canais Meta antes de produção. Executar após configurar os secrets:
`META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID` (Long-Lived Token com permissões
`pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`,
`pages_show_list`).

> Legenda: ✅ = passou · ❌ = falhou · ⚠️ = com observações.
> Cada passo indica **onde validar** (Admin UI + tabela na BD).

---

## 0. Pré-requisitos

- [ ] Secrets configurados no Supabase (Edge Functions → Settings).
- [ ] Cron `publish-dispatcher-every-5min` ativo.
- [ ] Página Facebook ligada à conta IG Business.
- [ ] Token validado no [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
- [ ] Canal `facebook` e `instagram` marcados como `enabled=true` em `publishing_channels`.
- [ ] Existe pelo menos 1 produto de teste com **1 imagem** e 1 com **≥2 imagens** (mesmo aspect ratio para IG carrossel).

---

## 1. Preview antes da publicação

- [ ] **1.1** Abrir Admin → aba **Publicação Social** → separador *Prontos*.
- [ ] **1.2** Selecionar produto: preview visual carrega imagem + caption gerada.
- [ ] **1.3** Alternar canal **Facebook** → mockup estilo FB (card horizontal com link).
- [ ] **1.4** Alternar canal **Instagram** → mockup quadrado com header gradient.
- [ ] **1.5** Produto com ≥2 imagens no IG → navegação de carrossel (setas + contador N/M).
- [ ] **1.6** Editar caption → gravar → recarregar página → caption persiste (`products.social_caption`).

---

## 2. Publicação — Facebook

### 2.1 Imagem única
- [ ] Selecionar produto com 1 imagem → canal **Facebook** → **Publicar**.
- [ ] Post aparece na página FB em ≤ 30s.
- [ ] `publishing_events`: `status=completed`, `attempts=1`.
- [ ] `publishing_logs`: `status=success`, `response.id` presente.
- [ ] `product_social_posts`: nova linha `channel_key=facebook`, `external_id`, `external_url`, `status=published`.
- [ ] `products.social_status=published`, `social_hash` snapshot.
- [ ] Painel: badge **live** aparece no canal Facebook.

### 2.2 Carrossel (produto ≥2 imagens)
> Facebook `/photos` publica apenas a imagem primária. O carrossel real é feito via `/feed` + `attached_media` — atualmente publicamos a imagem primária como single photo. Confirmar comportamento esperado.
- [ ] Publicar produto com 3 imagens → post FB mostra imagem primária + caption.
- [ ] `media.image_url` no `product_social_posts` = URL da primária.

---

## 3. Publicação — Instagram

### 3.1 Single (1 imagem)
- [ ] Selecionar produto 1-imagem → canal **Instagram** → **Publicar**.
- [ ] Post aparece no feed IG em ≤ 60s.
- [ ] `publishing_logs.response` mostra `container_id` + `media_id`.
- [ ] Polling `status_code=FINISHED` visível em `publishing_logs.request` (ou logs da edge function).
- [ ] `product_social_posts.media.mode = "single"`.

### 3.2 Carrossel (2–10 imagens, mesmo ratio)
- [ ] Produto com 3 imagens → **Publicar** IG.
- [ ] Post carrossel aparece no feed com 3 slides.
- [ ] `publishing_logs.response`: N container IDs + 1 parent ID + media ID final.
- [ ] `product_social_posts.media.mode = "carousel"`, `images.length = 3`.

### 3.3 Imagem inválida (skip sem retry)
- [ ] Editar produto → substituir imagem por uma **portrait 9:16 ou >8 MB ou <320px**.
- [ ] Tentar publicar IG.
- [ ] `publishing_events`: `status=completed` (skipped, não failed), `attempts=1`.
- [ ] `publishing_logs.status=skipped`, mensagem clara (ex.: "aspect ratio 0.56 fora do intervalo 0.8–1.91").
- [ ] **Nenhum retry** agendado (`next_attempt_at IS NULL`).
- [ ] Painel mostra motivo do skip.

### 3.4 Carrossel com ratios diferentes
- [ ] Produto com 2 imagens de ratios distintos → **Publicar** IG.
- [ ] Skip com mensagem "todas as imagens do carrossel devem partilhar o mesmo aspect ratio".

---

## 4. Republicação

- [ ] Selecionar produto já publicado (badge live) → **Republicar**.
- [ ] Testar duas opções: **manter antigo** (novo post criado) e **substituir** (`delete_previous=true`).
- [ ] Post antigo desaparece da página (quando `delete_previous`), novo post visível.
- [ ] `product_social_posts`: linha antiga com `status=deleted`, linha nova `status=published`.
- [ ] Emitido evento `social.republish` em `publishing_events`.

---

## 5. Eliminação

- [ ] Selecionar publicação live → **Apagar**.
- [ ] Post removido do FB/IG (verificar diretamente na página).
- [ ] `product_social_posts.status=deleted`, `updated_at` recente.
- [ ] Se era o único post ativo desse canal → `products.social_status = ready_for_social`.
- [ ] Evento `social.delete` em `publishing_events` com `status=completed`.

---

## 6. Deteção de `outdated` + `changed_fields`

- [ ] Publicar produto → `social_status=published`.
- [ ] Editar **título** e **preço** do produto → gravar.
- [ ] Verificar `products.social_status = outdated` (via trigger `refresh_product_social_hash`).
- [ ] `product_social_hash_audit`: nova linha com `changed_fields = ["price","title"]`.
- [ ] Painel → separador **Desatualizados** → produto listado, chips mostram *Título* e *Preço* alterados.
- [ ] Ação **Manter** → `useAcceptOutdated` → `social_status=published` sem republicar.
- [ ] Ação **Republicar** → cria novo post; hash atualiza.
- [ ] Adicionar/remover imagem → também dispara `outdated` (trigger `trg_refresh_social_hash_images`).

---

## 7. Tratamento de erros Graph API

### 7.1 Token inválido / expirado
- [ ] Trocar `META_PAGE_ACCESS_TOKEN` por valor inválido → tentar publicar.
- [ ] `publishing_logs.error`: `Invalid OAuth access token [code=190 type=OAuthException trace=...] (HTTP 400)`.
- [ ] Painel mostra `MetaErrorBlock` com mensagem + code 190 + trace.
- [ ] Dispatcher agenda retry com backoff exponencial (1min → 5min → 15min → ...).

### 7.2 Permissões insuficientes
- [ ] Token válido sem `instagram_content_publish` → publicar IG.
- [ ] Erro code 200/294 visível no painel com mensagem original da Meta.

### 7.3 Rate limit
- [ ] Simular (ou aguardar) resposta 4/17/32/613 → dispatcher marca `failed` + `next_attempt_at`.
- [ ] Retry acontece no timing do backoff, não imediato.

### 7.4 Erro genérico da Graph API
- [ ] Verificar que `publishing_logs.response` mantém JSON bruto completo (debug profundo).
- [ ] `publishing_events.last_error` = mensagem humana formatada.

---

## 8. Retries e comportamento do dispatcher

- [ ] Forçar falha transitória → verificar sequência: `attempts=1,2,3,4,5,6`.
- [ ] `retry_cycle=0` durante o ciclo automático; ao esgotar → `status=failed`, `last_error="max attempts reached"`.
- [ ] Ação manual **Retry** no painel → incrementa `retry_cycle`, permite 6 novas tentativas.
- [ ] `publishing_event_transitions` regista cada mudança de estado (pending→processing→failed→processing→completed).
- [ ] Concorrência: invocar dispatcher 2× em paralelo → `claim_publishing_events` (SKIP LOCKED) garante que cada evento é processado 1×.
- [ ] Dedupe: emitir 2× o mesmo evento em <1min → segundo é rejeitado por `dedupe_key` UNIQUE.

---

## 9. Validação cruzada das tabelas

Para **cada** publicação bem-sucedida confirmar consistência:

| Tabela | Verificação |
|---|---|
| `publishing_events` | `status=completed`, `processed_at` preenchido, `locked_by=NULL` |
| `publishing_logs` | 1 linha por canal × tentativa; `status ∈ {success, failed, skipped}` |
| `publishing_event_transitions` | Rastreio completo do ciclo de vida |
| `product_social_posts` | 1 linha por publicação live; `external_id` único por canal |
| `products` | `social_status` coerente; `social_hash` = último snapshot publicado |
| `product_social_hash_audit` | 1 linha por mudança relevante do produto |

SQL rápido de sanidade:
```sql
-- Eventos "presos" em processing há >10min (não deve existir)
select * from publishing_events
where status='processing' and locked_at < now() - interval '10 minutes';

-- Posts órfãos (published sem produto ativo)
select p.* from product_social_posts p
left join products pr on pr.id=p.product_id
where p.status='published' and (pr.id is null or pr.is_active=false);

-- Divergência hash vs status
select id, social_status, social_hash from products
where social_status='published'
  and social_hash is distinct from compute_product_social_hash(id);
```

---

## 10. Rollback / kill-switch

- [ ] Desativar canal: `update publishing_channels set enabled=false where key='facebook';` → novas publicações devolvem `skipped` sem chamar a Graph API.
- [ ] Reativar canal → publicações voltam a fluir sem restart de edge function.

---

## Aceitação final

Fase 2.4 considera-se validada em produção quando **todos os itens de 1–9 estão ✅** e o item 10 foi exercitado com sucesso. Registar screenshots do painel + snapshots das tabelas como evidência.