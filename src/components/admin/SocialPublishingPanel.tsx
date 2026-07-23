import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Facebook,
  Instagram,
  ExternalLink,
  RefreshCw,
  Trash2,
  Check,
  AlertTriangle,
  Send,
  Heart,
  MessageCircle,
  Bookmark,
} from "lucide-react";
import {
  useSocialProducts,
  useSocialPosts,
  useLatestHashAudit,
  useSaveCaption,
  usePublishToSocial,
  useDeleteSocial,
  useAcceptOutdated,
  type SocialProductRow,
} from "@/hooks/useSocialPublishing";
import { useToast } from "@/hooks/use-toast";

const SITE_URL =
  (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL || "https://lega.pt";

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  description: "Descrição",
  price: "Preço",
  currency: "Moeda",
  brand: "Marca",
  category: "Categoria",
  subcategory: "Subcategoria",
  year: "Ano",
  condition: "Estado",
  model: "Modelo",
  stock_status: "Disponibilidade",
  location: "Localização",
  is_active: "Ativação",
  images: "Imagens",
  specs: "Especificações",
};

const statusLabel = (s: string) =>
  ({
    ready_for_social: "Pronto para publicar",
    published: "Publicado",
    outdated: "Desatualizado",
    not_ready: "Rascunho",
    failed: "Falhado",
  }[s] ?? s);

const statusVariant = (s: string) =>
  ({
    ready_for_social: "secondary",
    published: "default",
    outdated: "destructive",
    failed: "destructive",
  }[s] ?? "outline") as any;

function primaryImage(p: SocialProductRow): string | null {
  const imgs = p.images ?? [];
  if (!imgs.length) return null;
  return (
    imgs.find((i) => i.is_primary)?.image_url ??
    [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
      ?.image_url ??
    null
  );
}

function autoCaption(p: SocialProductRow): string {
  const link = `${SITE_URL}/veiculo/${p.id}`;
  const parts: string[] = [`🚚 ${p.title}`];
  const meta = [
    p.brand?.name,
    p.year ? `${p.year}` : null,
    p.price
      ? new Intl.NumberFormat("pt-PT", {
          style: "currency",
          currency: p.currency ?? "EUR",
          maximumFractionDigits: 0,
        }).format(p.price)
      : null,
  ].filter(Boolean);
  if (meta.length) parts.push(meta.join(" · "));
  if (p.description) {
    const t = p.description.replace(/\s+/g, " ").trim();
    parts.push(t.length > 400 ? `${t.slice(0, 397)}…` : t);
  }
  parts.push("", link, "#LEGA #camioes #maquinaria");
  return parts.join("\n");
}

type ChannelKey = "facebook" | "instagram";

const CHANNEL_META: Record<ChannelKey, { label: string; Icon: typeof Facebook }> = {
  facebook: { label: "Facebook", Icon: Facebook },
  instagram: { label: "Instagram", Icon: Instagram },
};

function ProductCard({ product }: { product: SocialProductRow }) {
  const [caption, setCaption] = useState(product.social_caption ?? autoCaption(product));
  const [channel, setChannel] = useState<ChannelKey>("facebook");
  useEffect(() => {
    setCaption(product.social_caption ?? autoCaption(product));
  }, [product.id, product.social_caption]);

  const { data: posts = [] } = useSocialPosts(product.id);
  const { data: audit } = useLatestHashAudit(
    product.social_status === "outdated" ? product.id : null,
  );
  const saveCaption = useSaveCaption();
  const publishMut = usePublishToSocial();
  const deleteMut = useDeleteSocial();
  const acceptMut = useAcceptOutdated();
  const { toast } = useToast();

  const image = primaryImage(product);
  const link = `${SITE_URL}/veiculo/${product.id}`;
  const orderedImages = useMemo(() => {
    const imgs = product.images ?? [];
    return [...imgs]
      .sort((a, b) => {
        if (!!b.is_primary !== !!a.is_primary) return b.is_primary ? 1 : -1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      })
      .map((i) => i.image_url)
      .filter(Boolean)
      .slice(0, 10);
  }, [product.images]);
  const [igIndex, setIgIndex] = useState(0);
  useEffect(() => setIgIndex(0), [product.id, channel]);
  const postByChannel = (key: ChannelKey) =>
    posts.find((p) => p.channel_key === key && p.status === "published");
  const activePost = postByChannel(channel);
  const imageCount = (product.images ?? []).length;

  const changedFields = useMemo(() => {
    const raw = audit?.changed_fields;
    if (!raw) return [] as string[];
    if (Array.isArray(raw)) return raw as string[];
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [audit]);

  const runPublish = (opts: { republish?: boolean; deletePrevious?: boolean } = {}) => {
    publishMut.mutate(
      {
        productId: product.id,
        channel,
        caption,
        imageUrl: image,
        ...opts,
      },
      {
        onSuccess: () =>
          toast({
            title: "Publicação enfileirada",
            description: `${CHANNEL_META[channel].label} será atualizado dentro de instantes.`,
          }),
        onError: (e: any) =>
          toast({
            title: "Erro",
            description: String(e?.message ?? e),
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-lg truncate">{product.title}</CardTitle>
          <p className="text-xs text-muted-foreground truncate">
            {[product.brand?.name, product.year, product.price ? `${product.price} €` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <Badge variant={statusVariant(product.social_status)}>
          {statusLabel(product.social_status)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {product.social_status === "outdated" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Publicação desatualizada</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Os seguintes campos mudaram desde a última publicação:</p>
              <div className="flex flex-wrap gap-1">
                {changedFields.length ? (
                  changedFields.map((f) => (
                    <Badge key={f} variant="outline" className="text-xs">
                      {FIELD_LABELS[f] ?? f}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs">Conteúdo divergente do último post.</span>
                )}
              </div>
              <p className="text-xs">
                Escolha uma ação: manter, republicar em novo post, ou apagar o antigo e criar um novo.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Legenda ({caption.length} car.)
            </label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCaption(autoCaption(product))}
              >
                <RefreshCw className="h-3 w-3 mr-2" /> Regenerar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  saveCaption.mutate(
                    { productId: product.id, caption },
                    {
                      onSuccess: () =>
                        toast({ title: "Legenda guardada" }),
                    },
                  )
                }
              >
                Guardar rascunho
              </Button>
            </div>
          </div>

          {/* Preview */}
          {channel === "instagram" ? (
            <InstagramPreview
              title={product.title}
              caption={caption}
              images={orderedImages}
              index={igIndex}
              setIndex={setIgIndex}
            />
          ) : (
            <FacebookPreview
              title={product.title}
              caption={caption}
              image={image}
              link={link}
            />
          )}
        </div>

        {/* Channel selector */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <span className="text-xs text-muted-foreground mr-1">Canal:</span>
          {(Object.keys(CHANNEL_META) as ChannelKey[]).map((k) => {
            const Icon = CHANNEL_META[k].Icon;
            const p = postByChannel(k);
            return (
              <Button
                key={k}
                size="sm"
                variant={channel === k ? "default" : "outline"}
                onClick={() => setChannel(k)}
                className="h-8"
              >
                <Icon className="h-3 w-3 mr-2" />
                {CHANNEL_META[k].label}
                {p && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px]">
                    live
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {product.social_status === "ready_for_social" && (
            <Button
              onClick={() => runPublish()}
              disabled={publishMut.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Publicar em {CHANNEL_META[channel].label}
            </Button>
          )}
          {product.social_status === "outdated" && (
            <>
              <Button
                variant="secondary"
                onClick={() =>
                  acceptMut.mutate(product.id, {
                    onSuccess: () => toast({ title: "Publicação marcada como atual" }),
                  })
                }
                disabled={acceptMut.isPending}
              >
                <Check className="h-4 w-4 mr-2" /> Manter atual
              </Button>
              <Button
                onClick={() => runPublish({ republish: true })}
                disabled={publishMut.isPending}
              >
                <Send className="h-4 w-4 mr-2" /> Republicar (novo post)
              </Button>
              <Button
                variant="destructive"
                onClick={() => runPublish({ republish: true, deletePrevious: true })}
                disabled={publishMut.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Apagar antigo + publicar novo
              </Button>
            </>
          )}
          {(product.social_status === "published" || !!activePost) && (
            <>
              {activePost?.external_url && (
                <Button variant="outline" asChild>
                  <a href={activePost.external_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Ver em{" "}
                    {CHANNEL_META[channel].label}
                  </a>
                </Button>
              )}
              {!activePost && product.social_status === "published" && (
                <Button onClick={() => runPublish()} disabled={publishMut.isPending}>
                  <Send className="h-4 w-4 mr-2" /> Publicar em{" "}
                  {CHANNEL_META[channel].label}
                </Button>
              )}
              {activePost && (
                <>
              <Button
                variant="ghost"
                onClick={() => runPublish({ republish: true })}
                disabled={publishMut.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Republicar
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  deleteMut.mutate(
                    {
                      productId: product.id,
                          channel,
                          externalId: activePost?.external_id,
                    },
                    {
                      onSuccess: () =>
                        toast({ title: "Apagamento enfileirado" }),
                    },
                  )
                }
                disabled={deleteMut.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Apagar publicação
              </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Multi-channel state summary */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
          {(Object.keys(CHANNEL_META) as ChannelKey[]).map((k) => {
            const Icon = CHANNEL_META[k].Icon;
            const p = postByChannel(k);
            return (
              <span key={k} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {CHANNEL_META[k].label}: {p ? "publicado" : "por publicar"}
              </span>
            );
          })}
          {channel === "instagram" && imageCount === 0 && (
            <span className="text-destructive">
              Instagram requer pelo menos uma imagem.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FacebookPreview({
  title, caption, image, link,
}: { title: string; caption: string; image: string | null; link: string }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-muted/20">
      <div className="flex items-center gap-2 p-3 border-b bg-background">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Facebook className="h-4 w-4 text-primary" />
        </div>
        <div className="text-xs">
          <p className="font-semibold">LEGA</p>
          <p className="text-muted-foreground">Facebook · Pré-visualização</p>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm whitespace-pre-line line-clamp-6">{caption}</p>
      </div>
      {image ? (
        <img src={image} alt={title} className="w-full aspect-video object-cover" loading="lazy" />
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center text-xs text-muted-foreground">
          Sem imagem principal
        </div>
      )}
      <div className="p-3 border-t bg-background">
        <p className="text-[10px] uppercase text-muted-foreground">lega.pt</p>
        <p className="text-xs font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{link}</p>
      </div>
    </div>
  );
}

function InstagramPreview({
  title, caption, images, index, setIndex,
}: {
  title: string;
  caption: string;
  images: string[];
  index: number;
  setIndex: (n: number) => void;
}) {
  const isCarousel = images.length > 1;
  const current = images[Math.min(index, Math.max(images.length - 1, 0))];
  const short = caption.length > 125 ? `${caption.slice(0, 125)}… ` : caption;

  return (
    <div className="border rounded-lg overflow-hidden bg-background max-w-[420px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <span className="text-[10px] font-bold">L</span>
          </div>
        </div>
        <div className="text-xs flex-1 min-w-0">
          <p className="font-semibold truncate">lega.pt</p>
          <p className="text-muted-foreground text-[10px] truncate">Patrocinado</p>
        </div>
        <span className="text-muted-foreground text-lg leading-none">⋯</span>
      </div>

      {/* Square media */}
      <div className="relative aspect-square bg-muted">
        {current ? (
          <img
            src={current}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
        {isCarousel && (
          <>
            <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              {index + 1}/{images.length}
            </span>
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white text-sm"
                aria-label="Anterior"
              >
                ‹
              </button>
            )}
            {index < images.length - 1 && (
              <button
                type="button"
                onClick={() => setIndex(index + 1)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white text-sm"
                aria-label="Seguinte"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 px-3 py-2">
        <Heart className="h-5 w-5" />
        <MessageCircle className="h-5 w-5" />
        <SendIcon className="h-5 w-5" />
        <div className="flex-1" />
        <Bookmark className="h-5 w-5" />
      </div>

      {isCarousel && (
        <div className="flex justify-center gap-1 pb-1">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1 w-1 rounded-full ${i === index ? "bg-primary" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}

      {/* Caption */}
      <div className="px-3 pb-3 space-y-1">
        <p className="text-xs">
          <span className="font-semibold mr-1">lega.pt</span>
          <span className="whitespace-pre-line">{short}</span>
          {caption.length > 125 && (
            <span className="text-muted-foreground">mais</span>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase">
          {isCarousel ? `Carrossel · ${images.length} imagens` : "Publicação simples"}
        </p>
      </div>
    </div>
  );
}

export default function SocialPublishingPanel() {
  const { data: products = [], isLoading } = useSocialProducts();
  const [tab, setTab] = useState<"ready_for_social" | "outdated" | "published">(
    "ready_for_social",
  );

  const grouped = useMemo(() => {
    const g: Record<string, SocialProductRow[]> = {
      ready_for_social: [],
      outdated: [],
      published: [],
    };
    for (const p of products) {
      (g[p.social_status] ??= []).push(p);
    }
    return g;
  }, [products]);

  const current = grouped[tab] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "ready_for_social", label: "Prontos" },
            { key: "outdated", label: "Desatualizados" },
            { key: "published", label: "Publicados" },
          ] as const
        ).map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <Badge variant="secondary" className="ml-2">
              {grouped[t.key]?.length ?? 0}
            </Badge>
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : current.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum produto neste estado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {current.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
