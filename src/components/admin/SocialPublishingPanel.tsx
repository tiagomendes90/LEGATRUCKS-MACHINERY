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

function ProductCard({ product }: { product: SocialProductRow }) {
  const [caption, setCaption] = useState(product.social_caption ?? autoCaption(product));
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
  const fbPost = posts.find(
    (p) => p.channel_key === "facebook" && p.status === "published",
  );

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
        channel: "facebook",
        caption,
        imageUrl: image,
        ...opts,
      },
      {
        onSuccess: () =>
          toast({
            title: "Publicação enfileirada",
            description: "O Facebook será atualizado dentro de instantes.",
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
          <div className="border rounded-lg overflow-hidden bg-muted/20">
            <div className="flex items-center gap-2 p-3 border-b bg-background">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Facebook className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xs">
                <p className="font-semibold">LEGA</p>
                <p className="text-muted-foreground">Pré-visualização · Público</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-sm whitespace-pre-line line-clamp-6">{caption}</p>
            </div>
            {image ? (
              <img
                src={image}
                alt={product.title}
                className="w-full aspect-video object-cover"
                loading="lazy"
              />
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Sem imagem principal
              </div>
            )}
            <div className="p-3 border-t bg-background">
              <p className="text-[10px] uppercase text-muted-foreground">lega.pt</p>
              <p className="text-xs font-medium truncate">{product.title}</p>
              <p className="text-xs text-muted-foreground truncate">{link}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          {product.social_status === "ready_for_social" && (
            <Button
              onClick={() => runPublish()}
              disabled={publishMut.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Publicar no Facebook
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
          {product.social_status === "published" && (
            <>
              {fbPost?.external_url && (
                <Button variant="outline" asChild>
                  <a href={fbPost.external_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Ver no Facebook
                  </a>
                </Button>
              )}
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
                      channel: "facebook",
                      externalId: fbPost?.external_id,
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
        </div>

        {/* Coming soon indicators */}
        <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Instagram className="h-3 w-3" /> Instagram — Fase 2.4
          </span>
        </div>
      </CardContent>
    </Card>
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
