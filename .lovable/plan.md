# Tradução global dos produtos (PT / EN / FR)

## A. Estrutura actual

**Dados dos produtos** (`products`): os únicos campos realmente linguísticos são `title`, `description` e, marginalmente, `model` (que é técnico e não deve ser traduzido). Não existem campos "subtítulo", "descrição curta", "características" ou "notas" na base de dados — o cartão e a página de detalhe mostram apenas título, descrição, marca, modelo, ano, preço, condição, localização, imagens e especificações.

**Especificações**: `spec_definitions` (17 definições: `name` + `label`) e `spec_values` (valor numérico, texto ou booleano). Hoje existe apenas **1** valor textual em toda a base de dados — o resto é numérico.

**Taxonomia**: `categories` e `subcategories` guardam apenas `name` em português. As 6 categorias principais já são traduzidas no frontend por chaves estáticas (`nav.trucks`, `nav.machinery`…) no `Navbar`, mas essa tradução **não é usada** nas páginas de categoria, breadcrumbs, badges dos cartões nem na página de detalhe. As subcategorias não têm qualquer tradução.

**Sistema de idiomas**: i18next (PT/EN/FR) para a interface estática; nenhum componente traduz dados vindos da BD.

**Newsletter**: já tem o seu motor multilingue e já lê a tabela `product_translations` (product_id, language_code, title, description) — tabela que existe, tem RLS, mas está **vazia** (0 registos). A geração de traduções foi implementada na função `newsletter-translate-products`.

**Volume actual**: 6 produtos activos. O custo de traduzir tudo é irrelevante.

## B. Problema

A tradução de produtos ficou fechada dentro do módulo Newsletter: a tabela certa existe, mas só o editor de campanhas sabe preenchê-la e só o render de email sabe lê-la. O site público continua a mostrar sempre o conteúdo original. As categorias/subcategorias não têm sequer uma fonte de tradução central.

## C. Arquitectura proposta

Uma única fonte de verdade, partilhada por site, admin, newsletter e redes sociais:

```text
products (conteúdo original, nunca alterado)
   └─ product_translations (por idioma: title, description, fields jsonb)
categories / subcategories
   └─ taxonomy_translations (por idioma: name)
```

- **Camada partilhada** `src/lib/i18n/productContent.ts` — funções puras, sem chamadas de rede:
  - `resolveProductContent(product, lang)` → `{ title, description, isFallback }`
  - `resolveTaxonomyName(entity, lang)` → nome da categoria/subcategoria
  - `resolveSpecLabel(def, lang)` / `resolveSpecValue(value, lang)`
  - Regra transversal: valores com dígitos, unidades, códigos, URLs, IDs e marcas nunca passam pela tradução.
- **Hook** `useProductLanguage()` devolve o idioma activo do i18next já normalizado (`pt`/`en`/`fr`) e uma função `tp(product)` para uso directo nos componentes.
- **Geração de traduções**: a edge function existente é generalizada para `translate-products` (admin-only, idempotente: só gera o que falta, grava e reutiliza). Passa a tratar também taxonomia. A `newsletter-translate-products` mantém-se como alias para não partir nada.
- **Newsletter**: passa a ler exactamente as mesmas linhas — já o faz para `product_translations`; a taxonomia deixa de usar o dicionário `term.*` interno da newsletter e passa a `taxonomy_translations`.

## D. Ficheiros a alterar

Frontend (dados, sem qualquer alteração de design):
- `src/lib/i18n/productContent.ts` (novo), `src/hooks/useProductLanguage.tsx` (novo)
- `src/hooks/useVehicles.tsx`, `useVehicleSearch.tsx`, `useFeaturedVehicles.tsx` — acrescentar `translations:product_translations(...)` e o nome traduzido da taxonomia à mesma query (sem queries extra)
- `src/pages/NewVehicleCategory.tsx`, `src/pages/VehicleDetails.tsx`, `src/components/SimilarVehicles.tsx`, `src/components/VehicleInfo.tsx`, `src/components/home/FeaturedVehiclesSection.tsx`, `src/components/VehicleSearchBar.tsx`, `src/components/CategorySidebarFilter.tsx`, `src/components/NewVehicleFilter.tsx` — substituir `vehicle.title` / `subcategory?.name` pela função de resolução

Admin:
- `src/admin/ProductForm.tsx` — separador/secção "Traduções" no fim do formulário existente, com cobertura por idioma (PT ✓ / EN ✓ / FR —), botão "Gerar em falta" e edição manual do texto gerado. O formulário de criação não muda.
- `src/admin/ProductList.tsx` — indicador discreto de cobertura por produto

Backend:
- `supabase/functions/translate-products/index.ts` (generalização da função actual)
- `supabase/functions/_shared/publishing/i18n/*` e `newsletterTemplate.ts` — apontar a taxonomia à nova tabela

SEO:
- `src/components/SEO.tsx` e os JSON-LD das páginas de produto/categoria passam a usar o conteúdo resolvido, com `hreflang` coerente. **URLs e rotas não mudam.**

## E. Alterações à base de dados

Duas alterações aditivas, sem perda de dados:
1. `product_translations`: acrescentar `fields jsonb not null default '{}'` (especificações textuais e campos futuros) e `source_language text`.
2. Nova tabela `taxonomy_translations` (entity_type `category`/`subcategory`, entity_id, language_code, name) com leitura pública e escrita apenas de administrador.

Nada é apagado nem renomeado; `products`, `categories`, `subcategories` e `brands` ficam intactos.

## F. Fallback

Por campo: tradução do idioma pedido → **conteúdo original do produto** → cadeia de fallback do idioma → vazio. O original vem sempre antes de traduções de outros idiomas, para que PT nunca mostre inglês. Nunca existem campos vazios e nunca se traduz durante o render.

## G. Performance

Traduções carregadas na mesma query dos produtos (join aninhado — zero N+1, zero pedidos extra). A resolução em runtime é uma função pura sobre dados já em memória. A geração por IA acontece só a pedido do administrador e é persistida; mudar de idioma no site nunca chama serviços externos. Cache do React Query mantém-se como está, com o idioma incluído na chave.

## H. Newsletter

Deixa de ter sistema próprio: usa `product_translations` e `taxonomy_translations` através da mesma camada de resolução. Preview e envio continuam a ler a mesma linha guardada, logo permanecem idênticos entre si.

## Compatibilidade

Produtos, categorias, subcategorias, marcas, filtros, imagens, admin, newsletter, publicação em Facebook/Instagram e histórico ficam intactos. Nenhuma alteração visual, de layout ou de rotas.

## Execução

1. Migração (2 alterações aditivas)
2. Camada partilhada de resolução + queries
3. Componentes do site público
4. Painel de traduções no admin + função de geração
5. Newsletter a consumir a mesma fonte
6. Gerar traduções EN/FR para os 6 produtos e validar o caso Yanmar VIO33-6 / Volvo L180D em PT, EN e FR
