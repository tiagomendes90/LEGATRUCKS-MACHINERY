import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Layers, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreativePreview from "./CreativePreview";
import {
  useCreativeTemplates,
  useDeleteTemplate,
  useDuplicateTemplate,
  useMediaStudioProducts,
  useSaveTemplate,
  useSetDefaultTemplate,
  useToggleTemplate,
} from "@/hooks/useCreativeTemplates";
import {
  BLOCK_LABELS,
  DEFAULT_CONFIG,
  LAYOUT_LABELS,
  type CreativeBlockKey,
  type CreativeKind,
  type CreativeLayout,
  type CreativeTemplate,
  type TemplateConfig,
} from "@/lib/creative/types";
import type { CreativeData } from "@/lib/creative/types";

const KIND_LABELS: Record<CreativeKind, string> = {
  story: "Story",
  reel_cover: "Capa de Reel",
};

const COLOR_FIELDS: Array<{ key: keyof TemplateConfig; label: string }> = [
  { key: "background", label: "Fundo" },
  { key: "surface", label: "Painel" },
  { key: "accent", label: "Acento" },
  { key: "text", label: "Texto" },
  { key: "muted", label: "Texto secundário" },
];

const SAMPLE: CreativeData = {
  productId: "sample",
  brand: "LEGA",
  model: "Modelo de exemplo",
  title: "Modelo de exemplo",
  price: "€ 45.000",
  year: "2019",
  usage: "4.250 h",
  location: "Leiria, Portugal",
  condition: "Usado",
  category: "Maquinaria",
  description: null,
  url: "https://www.lega.pt",
  website: "www.lega.pt",
  images: [],
  specs: [],
};

interface EditorState {
  id?: string;
  name: string;
  kind: CreativeKind;
  description: string;
  is_active: boolean;
  sort_order: number;
  config: TemplateConfig;
}

const emptyTemplate = (): EditorState => ({
  name: "Novo template",
  kind: "story",
  description: "",
  is_active: true,
  sort_order: 99,
  config: { ...DEFAULT_CONFIG, blocks: { ...DEFAULT_CONFIG.blocks } },
});

export function CreativeTemplatesPanel() {
  const { toast } = useToast();
  const { data: templates = [], isLoading } = useCreativeTemplates();
  const { data: products = [] } = useMediaStudioProducts();
  const saveTemplate = useSaveTemplate();
  const duplicate = useDuplicateTemplate();
  const remove = useDeleteTemplate();
  const toggle = useToggleTemplate();
  const setDefault = useSetDefaultTemplate();

  const [editor, setEditor] = useState<EditorState | null>(null);

  const previewData = useMemo(
    () => products[0]?.data ?? SAMPLE,
    [products],
  );
  const previewImage = previewData.images[0] ?? "";

  const patchConfig = (patch: Partial<TemplateConfig>) =>
    setEditor((prev) =>
      prev ? { ...prev, config: { ...prev.config, ...patch } } : prev,
    );

  const patchBlock = (key: CreativeBlockKey, value: boolean) =>
    setEditor((prev) =>
      prev
        ? {
            ...prev,
            config: {
              ...prev.config,
              blocks: { ...prev.config.blocks, [key]: value },
            },
          }
        : prev,
    );

  const handleSave = async () => {
    if (!editor) return;
    if (!editor.name.trim()) {
      toast({ title: "Indique um nome", variant: "destructive" });
      return;
    }
    try {
      await saveTemplate.mutateAsync(editor as Partial<CreativeTemplate>);
      toast({ title: "Template guardado" });
      setEditor(null);
    } catch (e: any) {
      toast({ title: "Erro ao guardar", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Biblioteca de Templates
          </CardTitle>
          <CardDescription>
            Crie, duplique e edite templates de Stories e capas de Reel sem alterar
            código — ideal para campanhas sazonais.
          </CardDescription>
        </div>
        <Button onClick={() => setEditor(emptyTemplate())}>
          <Plus className="mr-2 h-4 w-4" /> Novo template
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">A carregar…</p>}
        {!isLoading && !templates.length && (
          <p className="text-sm text-muted-foreground">Ainda não existem templates.</p>
        )}
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{t.name}</span>
                <Badge variant="outline">{KIND_LABELS[t.kind]}</Badge>
                <Badge variant="secondary">
                  {LAYOUT_LABELS[t.config.layout as CreativeLayout] ?? t.config.layout}
                </Badge>
                {t.is_default && <Badge>Por defeito</Badge>}
                {!t.is_active && <Badge variant="destructive">Inativo</Badge>}
              </div>
              {t.description && (
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="mr-2 flex items-center gap-2">
                <Switch
                  checked={t.is_active}
                  onCheckedChange={(v) => toggle.mutate({ id: t.id, is_active: v })}
                />
                <span className="text-xs text-muted-foreground">Ativo</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                title="Definir por defeito"
                onClick={() => setDefault.mutate(t)}
                disabled={t.is_default}
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Duplicar"
                onClick={() => duplicate.mutate(t)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Editar"
                onClick={() =>
                  setEditor({
                    id: t.id,
                    name: t.name,
                    kind: t.kind,
                    description: t.description ?? "",
                    is_active: t.is_active,
                    sort_order: t.sort_order,
                    config: { ...DEFAULT_CONFIG, ...t.config },
                  })
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" title="Eliminar">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar template?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é permanente. Os criativos já descarregados não são
                      afetados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove.mutate(t.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={Boolean(editor)} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editor?.id ? "Editar template" : "Novo template"}</DialogTitle>
            <DialogDescription>
              A pré-visualização usa dados reais de um produto ativo.
            </DialogDescription>
          </DialogHeader>

          {editor && (
            <div className="grid gap-6 md:grid-cols-[1fr_260px]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={editor.name}
                      onChange={(e) =>
                        setEditor({ ...editor, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={editor.kind}
                      onValueChange={(v) =>
                        setEditor({ ...editor, kind: v as CreativeKind })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="reel_cover">Capa de Reel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={editor.description}
                    onChange={(e) =>
                      setEditor({ ...editor, description: e.target.value })
                    }
                    placeholder="Campanha de Natal, Black Friday…"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Layout</Label>
                    <Select
                      value={editor.config.layout}
                      onValueChange={(v) =>
                        patchConfig({ layout: v as CreativeLayout })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LAYOUT_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      value={editor.sort_order}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          sort_order: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-3">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <div key={String(key)} className="space-y-2">
                      <Label>{label}</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-9 w-12 cursor-pointer rounded border bg-transparent"
                          value={String(editor.config[key] ?? "#000000")}
                          onChange={(e) =>
                            patchConfig({ [key]: e.target.value } as any)
                          }
                        />
                        <Input
                          value={String(editor.config[key] ?? "")}
                          onChange={(e) =>
                            patchConfig({ [key]: e.target.value } as any)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>
                    Intensidade do escurecimento ({Math.round((editor.config.overlay ?? 0.5) * 100)}%)
                  </Label>
                  <Slider
                    value={[Math.round((editor.config.overlay ?? 0.5) * 100)]}
                    min={0}
                    max={95}
                    step={5}
                    onValueChange={([v]) => patchConfig({ overlay: v / 100 })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Texto do CTA</Label>
                    <Input
                      value={editor.config.cta ?? ""}
                      onChange={(e) => patchConfig({ cta: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={editor.config.website ?? ""}
                      onChange={(e) => patchConfig({ website: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Faixa de campanha (opcional)</Label>
                    <Input
                      value={editor.config.ribbon ?? ""}
                      onChange={(e) => patchConfig({ ribbon: e.target.value })}
                      placeholder="BLACK FRIDAY"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm">Barra de acento</span>
                    <Switch
                      checked={editor.config.accentBar !== false}
                      onCheckedChange={(v) => patchConfig({ accentBar: v })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Blocos visíveis</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(Object.keys(BLOCK_LABELS) as CreativeBlockKey[]).map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <span className="text-sm">{BLOCK_LABELS[key]}</span>
                        <Switch
                          checked={editor.config.blocks?.[key] !== false}
                          onCheckedChange={(v) => patchBlock(key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">Template ativo</span>
                  <Switch
                    checked={editor.is_active}
                    onCheckedChange={(v) => setEditor({ ...editor, is_active: v })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <CreativePreview
                  data={previewData}
                  config={editor.config}
                  imageUrl={previewImage}
                  width={240}
                />
                <p className="text-xs text-muted-foreground">Pré-visualização 1080×1920</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveTemplate.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CreativeTemplatesPanel;
