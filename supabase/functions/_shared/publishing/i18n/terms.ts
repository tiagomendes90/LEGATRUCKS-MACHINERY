// Dicionário genérico de termos (categorias, subcategorias, rótulos e valores
// de especificações textuais). Reutiliza a tabela `newsletter_translations`
// com chaves `term.<normalizado>` — sem qualquer alteração de esquema.
//
// Marcas e modelos NUNCA passam por aqui: são nomes próprios.

/** Normaliza um termo para chave estável (minúsculas, espaços colapsados). */
export function termKey(text: string): string {
  return `term.${text.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

export interface TermLookup {
  /** Cadeia de fallback do idioma. */
  chain: (code: string) => string[];
  /** Valor bruto de uma chave arbitrária num idioma. */
  raw: (code: string, key: string) => string | undefined;
}

/**
 * Devolve a tradução do termo no idioma pedido, ou o próprio termo quando
 * não existir tradução guardada.
 */
export function translateTerm(
  lookup: TermLookup,
  lang: string,
  text: unknown,
): string {
  const original = text == null ? "" : String(text);
  if (!original.trim()) return original;
  const key = termKey(original);
  for (const c of lookup.chain(lang)) {
    const v = lookup.raw(c, key);
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return original;
}
