import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Download,
  Film,
  ImageIcon,
  Loader2,
  Save,
  Trash2,
  RotateCcw,
  Instagram,
  Facebook,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePersistentState } from "@/hooks/usePersistentState";
import CreativePreview from "./CreativePreview";
import {
  useCreativeTemplates,
  useMediaStudioProducts,
  useSavedCreatives,
  useSaveCreative,
  useDeleteCreative,
} from "@/hooks/useCreativeTemplates";
import {
  BLOCK_LABELS,
  DEFAULT_CONFIG,
  type CreativeBlockKey,
  type CreativeKind,
  type TemplateConfig,
} from "@/lib/creative/types";
import {
  canvasToBlob,
  downloadBlob,
  renderVerticalFrame,
  slugify,
} from "@/lib/creative/render";
import { buildReelKit } from "@/lib/creative/reelKit";
import { uploadCreative } from "@/lib/creative/uploadCreative";
import { emitPublishingEvent } from "@/lib/publishing";

const BLOCK_ORDER: CreativeBlockKey[] = [
  "logo",
  "brand",
  "model",
  "price",
  "year",
  "usage",
  "location",
  "qr",
  "website",
  "cta",
];

interface StudioTabProps {
  kind: CreativeKind;
  productId: string;
  setProductId: (v: string) => void;
}

function StudioTab({ kind, productId, setProductId }: StudioTabProps) {
  const { toast } = useToast();
  const { data: products = [], isLoading: loadingProducts } =
    useMediaStudioProducts();
  const { data: templates = [], isLoading: loadingTemplates } =
    useCreativeTemplates(kind);
  const activeTemplates = templates.filter((t) => t.is_active);

  const [templateId, setTemplateId] = usePersistentState<string>(
    `media-studio:${kind}:template`,
    "",
  );
  const [imageIndex, setImageIndex] = useState(0);
  const [overrides, setOverrides] = useState<Partial<Record<CreativeBlockKey, boolean>>>({});
  const [ctaText, setCtaText] = useState("");
  const [ctaTouched, setCtaTouched] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const product = useMemo(
    () => products.find((p) => p.id === productId) ?? products[0] ?? null,
    [products, productId],
  );

  const template = useMemo(() => {
    return (
      activeTemplates.find((t) => t.id === templateId) ??
      activeTemplates.find((t) => t.is_default) ??
      activeTemplates[0] ??
      null
    );
  }, [activeTemplates, templateId]);

  useEffect(() => {
    if (template && template.id !== templateId) setTemplateId(template.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  useEffect(() => {
    setImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!ctaTouched) setCtaText(template?.config?.cta ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  const { data: saved = [] } = useSavedCreatives(product?.id);
  const saveCreative = useSaveCreative();
  const deleteCreative = useDeleteCreative();

  const config: TemplateConfig = useMemo(() => {
    const base = { ...DEFAULT_CONFIG, ...(template?.config ?? {}) };
    return {
      ...base,
      cta: ctaText || base.cta,
      blocks: { ...base.blocks, ...overrides },
    };
  }, [template, overrides, ctaText]);

  const images = product?.data.images ?? [];
  const imageUrl = images[imageIndex] ?? images[0] ?? "";
  const reelKit = product ? buildReelKit(product.data) : null;

  const fileBase = product
    ? `lega-${kind === "story" ? "story" : "reel-cover"}-${slugify(
        `${product.data.brand} ${product.data.model}`,
      )}`
    : "lega-criativo";

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setDownloading(true);
    try {
      const blob = await canvasToBlob(canvasRef.current);
      downloadBlob(blob, `${fileBase}.png`);
      toast({ title: "PNG descarregado", description: `${fileBase}.png` });
    } catch (e: any) {
      toast({
        title: "Erro ao descarregar",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!product || !template) return;
    try {
      await saveCreative.mutateAsync({
        product_id: product.id,
        template_id: template.id,
        kind,
        label: `${template.name} · ${new Date().toLocaleDateString("pt-PT")}`,
        image_url: imageUrl || null,
        fields: config.blocks as Record<string, boolean>,
      });
      toast({ title: "Configuração guardada", description: "Pode reutilizar mais tarde." });
    } catch (e: any) {
      toast({ title: "Erro ao guardar", description: e?.message, variant: "destructive" });
    }
  };

  const handleZip = async () => {
    if (!product) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      if (canvasRef.current) {
        zip.file(`${fileBase}.png`, await canvasToBlob(canvasRef.current));
      }
      const list = images.slice(0, 12);
      for (let i = 0; i < list.length; i++) {
        try {
          const frame = await renderVerticalFrame(list[i]);
          zip.file(
            `frames/${String(i + 1).padStart(2, "0")}.png`,
            await canvasToBlob(frame),
          );
        } catch {
          /* imagem indisponível */
        }
      }
      if (reelKit) {
        zip.file(
          "reel.txt",
          [
            `TÍTULO\n${reelKit.title}`,
            `\nCTA\n${reelKit.cta}`,
            `\nDESCRIÇÃO\n${reelKit.description}`,
            `\nHASHTAGS\n${reelKit.hashtags.map((h) => `#${h}`).join(" ")}`,
          ].join("\n"),
        );
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${fileBase}-kit.zip`);
      toast({ title: "Kit descarregado", description: "Capa, imagens verticais e textos." });
    } catch (e: any) {
      toast({ title: "Erro no kit", description: e?.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: `${label} copiado` });
  };

  /**
   * Publica o criativo como Story: carrega o PNG para o storage público
   * (a Meta só aceita URLs públicos) e emite o evento no PublishingService.
   */
  const handlePublishStory = async (channel: "instagram_story" | "facebook_story") => {
    if (!product || !canvasRef.current) return;
    const label = channel === "instagram_story" ? "Instagram" : "Facebook";
    setPublishing(channel);
    try {
      const blob = await canvasToBlob(canvasRef.current);
      const publicUrl = await uploadCreative(blob, {
        productId: product.id,
        kind: "story",
        fileBase: slugify(`${product.data.brand} ${product.data.model}`),
      });
      await emitPublishingEvent({
        type: "social.story.publish",
        productId: product.id,
        payload: {
          channel,
          image_url: publicUrl,
          template_id: template?.id ?? null,
        },
      });
      toast({
        title: `Story enviada para ${label}`,
        description:
          "A publicação está em processamento. Acompanhe o estado no painel de Publicações.",
      });
    } catch (e: any) {
      toast({
        title: `Erro ao publicar no ${label}`,
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setPublishing(null);
    }
  };

  if (loadingProducts || loadingTemplates) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar...
      </div>
    );
  }

  if (!products.length) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Não existem produtos ativos para gerar criativos.
      </p>
    );
  }

  if (!activeTemplates.length) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Não existem templates ativos deste tipo. Ative ou crie um na Biblioteca de
        Templates.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={product?.id ?? ""} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={template?.id ?? ""} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher template" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.is_default ? " · por defeito" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Fotografia</Label>
          {images.length ? (
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  className={`h-16 w-24 overflow-hidden rounded-md border-2 transition ${
                    i === imageIndex
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Fotografia ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este produto não tem fotografias.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Campos apresentados</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BLOCK_ORDER.map((key) => {
              const value = config.blocks?.[key] !== false;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm">{BLOCK_LABELS[key]}</span>
                  <Switch
                    checked={value}
                    onCheckedChange={(v) =>
                      setOverrides((prev) => ({ ...prev, [key]: v }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Texto do CTA</Label>
          <Input
            value={ctaText}
            onChange={(e) => {
              setCtaTouched(true);
              setCtaText(e.target.value);
            }}
            placeholder="Disponível agora"
          />
        </div>

        {kind === "reel_cover" && reelKit && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Kit de Reel</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Título</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copy("Título", reelKit.title)}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copiar
                  </Button>
                </div>
                <Input readOnly value={reelKit.title} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Descrição otimizada</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copy("Descrição", reelKit.description)}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copiar
                  </Button>
                </div>
                <Textarea readOnly rows={10} value={reelKit.description} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Hashtags sugeridas</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copy(
                        "Hashtags",
                        reelKit.hashtags.map((h) => `#${h}`).join(" "),
                      )
                    }
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copiar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reelKit.hashtags.map((h) => (
                    <Badge key={h} variant="secondary">
                      #{h}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {saved.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Criativos guardados</Label>
              <div className="space-y-2">
                {saved
                  .filter((s) => s.kind === kind)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{s.label}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (s.template_id) setTemplateId(s.template_id);
                            const idx = images.indexOf(s.image_url ?? "");
                            if (idx >= 0) setImageIndex(idx);
                            setOverrides((s.fields ?? {}) as any);
                            toast({ title: "Configuração reutilizada" });
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCreative.mutate(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
        {product && (
          <CreativePreview
            data={product.data}
            config={config}
            imageUrl={imageUrl}
            width={320}
            onCanvas={(c) => {
              canvasRef.current = c;
            }}
          />
        )}
        <p className="text-xs text-muted-foreground">1080 × 1920 px · PNG</p>
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Descarregar PNG
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saveCreative.isPending}>
            <Save className="mr-2 h-4 w-4" /> Guardar configuração
          </Button>
          {kind === "reel_cover" && (
            <Button variant="secondary" onClick={handleZip} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" /> Descarregar kit (ZIP)
            </Button>
          )}
        </div>

        {kind === "story" && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Publicação automática</Label>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handlePublishStory("instagram_story")}
                disabled={!!publishing || !product}
              >
                {publishing === "instagram_story" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Instagram className="mr-2 h-4 w-4" />
                )}
                Publicar Story no Instagram
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handlePublishStory("facebook_story")}
                disabled={!!publishing || !product}
              >
                {publishing === "facebook_story" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Facebook className="mr-2 h-4 w-4" />
                )}
                Publicar Story no Facebook
              </Button>
              <p className="text-xs text-muted-foreground">
                As Stories expiram ao fim de 24 horas. O criativo é guardado no
                storage público antes de ser enviado para a Meta.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function MediaStudioPanel() {
  const [productId, setProductId] = usePersistentState<string>(
    "media-studio:product",
    "",
  );
  const [tab, setTab] = usePersistentState<string>("media-studio:tab", "story");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" /> Media Studio
        </CardTitle>
        <CardDescription>
          Gera Stories e capas de Reel em 1080×1920 a partir dos dados do produto.
          Os criativos são descarregados em PNG para publicação manual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="story">Stories</TabsTrigger>
            <TabsTrigger value="reel">Reels</TabsTrigger>
          </TabsList>
          <TabsContent value="story">
            <StudioTab
              kind="story"
              productId={productId}
              setProductId={setProductId}
            />
          </TabsContent>
          <TabsContent value="reel">
            <StudioTab
              kind="reel_cover"
              productId={productId}
              setProductId={setProductId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default MediaStudioPanel;
