import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Languages, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { APP_LANGUAGES, LANGUAGE_LABELS, type AppLanguage } from '@/lib/i18n/productContent';

interface Props {
  productId: string;
}

type Row = { language_code: string; title: string | null; description: string | null };

/**
 * Gestão das traduções de um produto (título e descrição por idioma).
 * Não altera os dados originais: escreve apenas em `product_translations`.
 */
export default function ProductTranslationsPanel({ productId }: Props) {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('product_translations')
      .select('language_code, title, description')
      .eq('product_id', productId);
    const map: Record<string, Row> = {};
    for (const r of (data ?? []) as Row[]) map[r.language_code] = r;
    setRows(map);
    setLoading(false);
  }, [productId]);

  useEffect(() => { void load(); }, [load]);

  const missing = APP_LANGUAGES.filter(
    (code) => !(rows[code]?.title || '').trim() && !(rows[code]?.description || '').trim(),
  );

  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-products', {
        body: { product_ids: [productId], targets: missing.length > 0 ? missing : APP_LANGUAGES },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success('Traduções geradas');
      await load();
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      toast.error(
        msg.includes('rate_limited') ? 'Limite de pedidos atingido. Tenta novamente daqui a pouco.'
          : msg.includes('payment_required') ? 'Créditos de IA esgotados.'
          : `Falha ao traduzir: ${msg}`,
      );
    } finally {
      setGenerating(false);
    }
  };

  const save = async (code: AppLanguage) => {
    setSaving(code);
    const row = rows[code] ?? { language_code: code, title: '', description: '' };
    const { error } = await supabase.from('product_translations').upsert(
      {
        product_id: productId,
        language_code: code,
        title: (row.title || '').trim() || null,
        description: (row.description || '').trim() || null,
      },
      { onConflict: 'product_id,language_code' },
    );
    setSaving(null);
    if (error) toast.error(`Falha ao guardar (${code.toUpperCase()}): ${error.message}`);
    else toast.success(`Tradução ${code.toUpperCase()} guardada`);
  };

  const update = (code: AppLanguage, patch: Partial<Row>) =>
    setRows((prev) => ({
      ...prev,
      [code]: { language_code: code, title: null, description: null, ...prev[code], ...patch },
    }));

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Traduções</span>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            APP_LANGUAGES.map((code) => {
              const ok = (rows[code]?.title || '').trim() || (rows[code]?.description || '').trim();
              return (
                <Badge key={code} variant={ok ? 'default' : 'outline'} className="text-[10px]">
                  {code.toUpperCase()} {ok ? '✓' : '—'}
                </Badge>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? 'Fechar' : 'Editar'}
          </Button>
          <Button type="button" size="sm" onClick={generate} disabled={generating || loading}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {missing.length > 0 ? 'Gerar em falta' : 'Regenerar'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Os dados originais nunca são alterados. Marcas, modelos e valores técnicos não são traduzidos.
      </p>

      {open && (
        <div className="space-y-4 pt-2">
          {APP_LANGUAGES.map((code) => (
            <div key={code} className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {LANGUAGE_LABELS[code]}
              </Label>
              <Input
                value={rows[code]?.title ?? ''}
                placeholder="Título traduzido (vazio = usa o original)"
                onChange={(e) => update(code, { title: e.target.value })}
              />
              <Textarea
                rows={4}
                value={rows[code]?.description ?? ''}
                placeholder="Descrição traduzida (vazio = usa a original)"
                onChange={(e) => update(code, { description: e.target.value })}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => save(code)}
                disabled={saving === code}
              >
                {saving === code ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar {code.toUpperCase()}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
