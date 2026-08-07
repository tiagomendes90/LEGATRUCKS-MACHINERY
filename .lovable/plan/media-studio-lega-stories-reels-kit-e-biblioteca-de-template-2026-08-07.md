# Media Studio LEGA — Stories, Reels Kit e Biblioteca de Templates

Evolução do módulo "Redes Sociais" para um Media Studio: geração automática de criativos premium (1080×1920 e capas de Reel) a partir dos dados já existentes do produto, com biblioteca de templates editável no Admin. Sem publicação automática de Stories/Reels — apenas geração, pré-visualização, download e reutilização.

## 1. Fonte de dados única

O Media Studio consome exatamente os mesmos dados de produto que os Posts e a Newsletter (marca, modelo, preço, ano, condição, localização, especificações dinâmicas como horas/km, galeria ordenada, link canónico). Nada é escrito à mão: os campos aparecem ou desaparecem consoante existam na base de dados.

Um único módulo de "dados de criativo" normaliza o produto para o formato usado pelos templates, incluindo deteção automática de horas (h) e quilómetros (km) a partir das especificações.

## 2. Biblioteca de Templates (Admin, sem código)

Nova tabela de templates de criativos guardada na base de dados. Cada template define:

- nome, tipo (Story ou Capa de Reel), estado ativo/inativo, template por defeito;
- paleta de cores (fundo, acento, texto), estilo de moldura e overlay;
- posição e visibilidade de cada bloco: logótipo, marca, modelo, preço, ano, horas/km, localização, QR Code, website, CTA;
- texto do CTA e do website;
- ordem de apresentação.

Painel de administração com: criar, duplicar, editar, ativar/desativar, definir por defeito e apagar. Isto permite campanhas sazonais (Natal, Black Friday, Novidades, Promoções) sem tocar no código.

Serão criados de origem 4 templates premium: Editorial Escuro, Split Diagonal, Minimal Claro e Etiqueta de Promoção.

## 3. Gerador de Stories (1080×1920)

Para cada produto, no separador Redes Sociais:

- escolha da fotografia (galeria do produto);
- escolha do template (entre os ativos);
- interruptores por campo (preço, ano, horas/km, localização, QR Code, website, CTA);
- pré-visualização fiel em tempo real, à escala;
- download em PNG 1080×1920;
- gravação da configuração para reutilização posterior.

QR Code gerado localmente para o URL canónico do produto em www.lega.pt.

## 4. Kit de Reels

Não gera vídeo. Gera e apresenta, prontos a copiar/descarregar:

- capa do Reel 1080×1920 (mesmos templates, variante de capa);
- título curto sugerido;
- descrição otimizada;
- hashtags sugeridas (marca, categoria, localização, genéricas do setor);
- CTA;
- pacote de imagens do produto preparadas para edição em vídeo (download em lote, enquadramento vertical).

A estrutura fica preparada para, no futuro, acrescentar geração de vídeo sem redesenhar o módulo.

## 5. Qualidade visual

Templates com padrão de fabricante/concessionário: tipografia forte e hierarquizada, gradientes controlados, faixas de acento, blocos de dados alinhados a grelha, logótipo sempre com margem de segurança, contraste garantido sobre a fotografia. Identidade LEGA (azul institucional + laranja) consistente em Posts, Stories, Reels e Newsletter.

## Notas técnicas

- Nova tabela `creative_templates` (leitura pública dos ativos, escrita apenas admin, com GRANTs) e `product_creatives` para guardar configurações geradas e reutilizáveis.
- Renderização no browser em canvas a resolução nativa 1080×1920 (sem dependência de screenshot de DOM), garantindo nitidez e texto correto.
- Dependência nova: gerador de QR Code e empacotador ZIP para o download em lote.
- Reutilização do módulo de dados de produto partilhado; nenhuma alteração ao pipeline de publicação existente (Facebook/Instagram/Newsletter mantêm-se intactos).
- Novo separador "Media Studio" dentro de Redes Sociais, com estado persistido como o resto do Admin.
