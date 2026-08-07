import { useMemo, useState } from "react";
import { Globe, Loader2, Plus, Save, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  useNewsletterLanguages,
  useSaveLanguage,
  useDeleteLanguage,
  useSetDefaultLanguage,
  useNewsletterStrings,
  useSaveNewsletterStrings,
  type NewsletterLanguage,
} from "@/hooks/useNewsletterI18n";

/** Chaves institucionais editáveis (espelham os defaults do backend). */
const STRING_GROUPS: Array<{ group: string; keys: Array<[string, string]> }> = [
  {
    group: "Cabeçalho",
    keys: [
      ["tagline", "Subtítulo do cabeçalho"],
      ["lang.label", "Etiqueta do seletor de idioma"],
    ],
  },
  {
    group: "Produtos",
    keys: [
      ["products.empty", "Mensagem sem viaturas"],
      ["product.cta", "Botão do produto"],
      ["product.price_on_request", "Preço sob consulta"],
      ["specs.year", "Ano"],
      ["specs.condition", "Estado"],
      ["specs.location", "Localização"],
      ["specs.stock", "Disponibilidade"],
    ],
  },
  {
    group: "Rodapé",
    keys: [
      ["cta.global", "Botão global (ver stock)"],
      ["footer.company", "Nome da empresa"],
      ["footer.reason", "Motivo de receção"],
      ["footer.unsubscribe", "Link de cancelamento"],
      ["footer.rights", "Direitos reservados ({year})"],
      ["view.online", "Ver online"],
    ],
  },
  {
    group: "Assuntos automáticos",
    keys: [
      ["subject.single", "1 viatura ({title})"],
      ["subject.multi", "N viaturas ({count})"],
    ],
  },
];

const emptyLang = (): NewsletterLanguage => ({
  code: "",
  label: "",
  native_label: "",
  flag_emoji: "",
  locale: "",
  is_active: true,
  is_default: false,
  fallback_code: null,
  sort_order: 100,
});

export default function NewsletterLanguagesPanel() {
  const languages = useNewsletterLanguages();
  const strings = useNewsletterStrings();
  const saveLang = useSaveLanguage();
  const delLang = useDeleteLanguage();
  const setDefault = useSetDefaultLanguage();
  const saveStrings = useSaveNewsletterStrings();

  const [draft, setDraft] = useState<NewsletterLanguage | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [activeLang, setActiveLang] = useState<string>("");

  const list = languages.data ?? [];
  const current = activeLang || list.find((l) => l.is_default)?.code || list[0]?.code || "";

  const stringMap = useMemo(() => {
    const m = new Map<string, { id?: string; value: string }>();
    for (const r of strings.data ?? []) m.set(`${r.language_code}::${r.key}`, { id: r.id, value: r.value });
    return m;
  }, [strings.data]);

  const valueFor = (key: string) =>
    edits[`${current}::${key}`] ?? stringMap.get(`${current}::${key}`)?.value ?? "";

  const persistLanguage = async (lang: NewsletterLanguage) => {
    if (!/^[a-z]{2}$/.test(lang.code)) {
      toast({ title: "Código inválido", description: "Usa duas letras (ex.: es, de, it).", variant: "destructive" });
      return;
    }
    await saveLang.mutateAsync({
      ...lang,
      label: lang.label || lang.code.toUpperCase(),
      native_label: lang.native_label || lang.label || lang.code.toUpperCase(),
      flag_emoji: lang.flag_emoji || null,
      locale: lang.locale || null,
      fallback_code: lang.fallback_code || null,
    });
    toast({ title: "Idioma guardado", description: lang.code.toUpperCase() });
    setDraft(null);
  };

  const persistStrings = async () => {
    const rows = Object.entries(edits).map(([k, value]) => {
      const [language_code, key] = k.split("::");
      return { id: stringMap.get(k)?.id, language_code, key, value };
    });
    if (!rows.length) return;
    await saveStrings.mutateAsync(rows);
    setEdits({});
    toast({ title: "Traduções guardadas", description: `${rows.length} textos atualizados.` });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" /> Idiomas da Newsletter
            </CardTitle>
            <CardDescription>
              Cada idioma gera uma versão independente da mesma campanha. Adicionar um novo idioma
              não exige alterações de código.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setDraft(emptyLang())}>
            <Plus className="h-4 w-4 mr-1" /> Novo idioma
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {languages.isLoading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
            </p>
          )}

          {list.map((l) => (
            <LanguageRow
              key={l.code}
              lang={l}
              languages={list}
              onSave={persistLanguage}
              onDelete={async () => {
                if (l.is_default) {
                  toast({ title: "Não é possível", description: "Define outro idioma por defeito primeiro.", variant: "destructive" });
                  return;
                }
                await delLang.mutateAsync(l.code);
                toast({ title: "Idioma removido", description: l.code.toUpperCase() });
              }}
              onSetDefault={async () => {
                await setDefault.mutateAsync(l.code);
                toast({ title: "Idioma por defeito", description: l.native_label });
              }}
            />
          ))}

          {draft && (
            <LanguageRow
              lang={draft}
              languages={list}
              isNew
              onSave={persistLanguage}
              onDelete={async () => setDraft(null)}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Textos institucionais</CardTitle>
            <CardDescription>
              Rodapé, botões e etiquetas de cada versão. Campos vazios usam a cadeia de fallback.
            </CardDescription>
          </div>
          <Button size="sm" onClick={persistStrings} disabled={!Object.keys(edits).length || saveStrings.isPending}>
            {saveStrings.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar textos
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={current} onValueChange={setActiveLang}>
            <TabsList className="flex-wrap">
              {list.map((l) => (
                <TabsTrigger key={l.code} value={l.code}>
                  {l.flag_emoji ? `${l.flag_emoji} ` : ""}{l.native_label}
                </TabsTrigger>
              ))}
            </TabsList>

            {list.map((l) => (
              <TabsContent key={l.code} value={l.code} className="space-y-5 pt-4">
                {STRING_GROUPS.map((g) => (
                  <div key={g.group} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.group}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {g.keys.map(([key, label]) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Textarea
                            rows={2}
                            value={valueFor(key)}
                            placeholder="Usar texto por defeito"
                            onChange={(e) =>
                              setEdits((prev) => ({ ...prev, [`${l.code}::${key}`]: e.target.value }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LanguageRow({
  lang,
  languages,
  isNew,
  onSave,
  onDelete,
  onSetDefault,
}: {
  lang: NewsletterLanguage;
  languages: NewsletterLanguage[];
  isNew?: boolean;
  onSave: (l: NewsletterLanguage) => Promise<void>;
  onDelete: () => Promise<void>;
  onSetDefault?: () => Promise<void>;
}) {
  const [local, setLocal] = useState<NewsletterLanguage>(lang);
  const set = (patch: Partial<NewsletterLanguage>) => setLocal((p) => ({ ...p, ...patch }));

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="grid gap-3 md:grid-cols-6">
        <div className="space-y-1">
          <Label className="text-xs">Código</Label>
          <Input
            value={local.code}
            disabled={!isNew}
            maxLength={2}
            onChange={(e) => set({ code: e.target.value.toLowerCase() })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nome</Label>
          <Input value={local.label} onChange={(e) => set({ label: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nome nativo</Label>
          <Input value={local.native_label} onChange={(e) => set({ native_label: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Bandeira</Label>
          <Input value={local.flag_emoji ?? ""} onChange={(e) => set({ flag_emoji: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Locale</Label>
          <Input placeholder="en-GB" value={local.locale ?? ""} onChange={(e) => set({ locale: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fallback</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={local.fallback_code ?? ""}
            onChange={(e) => set({ fallback_code: e.target.value || null })}
          >
            <option value="">—</option>
            {languages
              .filter((l) => l.code !== local.code)
              .map((l) => (
                <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>
              ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={local.is_active} onCheckedChange={(v) => set({ is_active: v })} />
          <span className="text-sm">Ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Ordem</Label>
          <Input
            type="number"
            className="h-9 w-20"
            value={local.sort_order}
            onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })}
          />
        </div>
        {local.is_default ? (
          <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> Por defeito</Badge>
        ) : (
          onSetDefault && (
            <Button size="sm" variant="ghost" onClick={onSetDefault}>
              <Star className="h-4 w-4 mr-1" /> Tornar por defeito
            </Button>
          )
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={() => onSave(local)}>
            <Save className="h-4 w-4 mr-1" /> {isNew ? "Criar" : "Guardar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> {isNew ? "Cancelar" : "Remover"}
          </Button>
        </div>
      </div>
    </div>
  );
}
