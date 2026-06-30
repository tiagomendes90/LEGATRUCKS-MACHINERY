## Objetivo

Unificar todas as submissões de formulários (atuais e futuros) num único pipeline: **uma edge function**, **um sistema anti-spam**, **um helper de email**, **uma tabela** (`contact_messages`). Cada formulário distingue-se apenas pelo campo `source`.

## Arquitetura final

```text
Qualquer formulário do site
        │
        ▼
useSubmitForm({ source, ...fields })   ← único hook React
        │
        ▼
edge function  submit-form             ← única edge function
        ├─ honeypot
        ├─ elapsedMs
        ├─ Turnstile siteverify
        ├─ validação Zod por source
        ├─ INSERT em contact_messages  ← única tabela
        └─ sendAdminNotification(...)  ← único helper de email
```

## Tipos de `source` suportados

| `source`          | Origem                                        | Campos extra relevantes                       |
| ----------------- | --------------------------------------------- | --------------------------------------------- |
| `general`         | Página Contactos                              | `interest`, `company`                          |
| `vehicle`         | Modal de contacto na ficha de veículo         | `vehicle_id`, `vehicle_title`, `vehicle_url`   |
| `quote`           | Pedido de orçamento de veículo                 | `vehicle_id`, `vehicle_title`, `vehicle_url`, `vehicle_price` |
| `parts`           | Pedido de peças (futuro)                       | `parts_reference`, `vehicle_title` (opcional)  |
| `sell_equipment`  | Venda de equipamentos (futuro)                 | livre via `metadata`                           |
| `*` (extensível)  | Qualquer novo formulário                       | livre via `metadata`                           |

Para suportar payloads heterogéneos sem alterar o schema sempre que surge um formulário novo, adiciono uma coluna `metadata JSONB` à tabela `contact_messages`. Campos centrais (nome, email, telefone, mensagem, veículo) ficam em colunas tipadas; tudo o resto vai para `metadata`.

## Alterações de base de dados

Uma única migração:

- `ALTER TABLE public.contact_messages ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;`
- (sem alteração de RLS — políticas existentes continuam válidas)

A tabela `orders` deixa de ser utilizada para novas submissões. Mantém-se em BD para histórico (sem perda de dados, sem alteração de schema).

## Backend

1. **Nova edge function `submit-form`** (`supabase/functions/submit-form/index.ts`):
   - Recebe `{ source, name, email, phone?, message, metadata?, vehicle_id?, vehicle_title?, vehicle_url?, interest?, company?, turnstileToken, honeypot, elapsedMs }`.
   - Valida com Zod: campos obrigatórios variam por `source` (`quote` exige `vehicle_id`+`vehicle_title`, etc.).
   - Re-utiliza a mesma lógica de honeypot, `MIN_ELAPSED_MS` e `verifyTurnstile` (extraídas para `supabase/functions/_shared/antiSpam.ts` para deixarem de estar duplicadas).
   - Insere em `contact_messages` com `source` e `metadata`.
   - Chama `sendAdminNotification` com mapeamento `source → kind`.

2. **`_shared/antiSpam.ts`**: helpers `verifyTurnstile`, `checkHoneypot`, `checkElapsed`, constantes partilhadas. Eliminação de duplicação entre funções.

3. **`_shared/sendAdminNotification.ts`**: estender `NotificationKind` para incluir `parts_request` e `sell_equipment`; helper passa a aceitar um `metadata` opcional renderizado como tabela genérica no email para tipos novos.

4. **Remoção** das edge functions antigas `submit-contact-message` e `submit-order` (substituídas pela nova). Faço o delete após o frontend migrar.

## Frontend

1. **Novo hook único `src/hooks/useSubmitForm.tsx`**:
   - `useSubmitForm()` devolve mutation tipada por `source`.
   - Centraliza toasts de sucesso/erro com `mapAntiSpamError`.
   - Invalida queries relevantes (`contact-messages`).

2. **Refactor**:
   - `src/pages/Contact.tsx` → usa `useSubmitForm` com `source: 'general'`.
   - `src/components/ContactVehicleModal.tsx` → `source: 'vehicle'`.
   - Hooks antigos `useCreateContactMessage` e `useCreateContactOrder` ficam como _thin wrappers_ que re-exportam de `useSubmitForm` (zero breaking changes) e são depois removidos quando não houver mais imports.

3. **Componente reutilizável `AntiSpamFields`** (`src/components/AntiSpamFields.tsx`): encapsula o honeypot + `TurnstileWidget` + cronómetro `elapsedMs` para qualquer formulário novo precisar apenas de:
   ```tsx
   <AntiSpamFields onReady={setAntiSpamPayload} />
   ```
   Reduz a fricção para adicionar futuros formulários a zero.

## Como adicionar um formulário novo no futuro

1. Criar a página/componente com o React Hook Form habitual.
2. Incluir `<AntiSpamFields />`.
3. Chamar `useSubmitForm().mutate({ source: 'novo_tipo', name, email, message, metadata: { ... } })`.
4. (Opcional) adicionar `source: 'novo_tipo'` ao mapeamento de subject/label em `sendAdminNotification`.

Sem nova edge function. Sem nova tabela. Sem nova lógica de Turnstile. Sem novo template de email.

## Compatibilidade e risco

- Inserts antigos em `contact_messages` continuam válidos (a coluna `metadata` tem default `{}`).
- A tabela `orders` mantém-se intacta — UI de admin (`RealOrderManagement`) continua a funcionar com dados históricos.
- Edge functions antigas só são removidas depois do frontend deixar de as invocar (sem janela de quebra).

## Entregáveis

- 1 migração SQL (`metadata JSONB`).
- 1 edge function nova (`submit-form`) + 1 módulo partilhado (`_shared/antiSpam.ts`).
- Atualização do `sendAdminNotification` para tipos extensíveis.
- 1 hook novo (`useSubmitForm`) + 1 componente (`AntiSpamFields`).
- Refactor de `Contact.tsx` e `ContactVehicleModal.tsx`.
- Remoção das edge functions `submit-contact-message` e `submit-order` após corte completo.
