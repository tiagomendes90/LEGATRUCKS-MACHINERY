import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Globe, Languages, Loader2, Monitor, Save, Send, Smartphone, TestTube2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  fetchCampaignPreview,
  useSaveCampaign,
  useSendCampaign,
  useScheduleCampaign,
  sendTestEmail,
  usePublishableProducts,
  fetchProductTranslationCoverage,
  translateCampaignProducts,
  type ProductTranslationCoverage,
  useLists,
  useTemplates,
  useSubscribers,
  type NewsletterCampaign,
} from "@/hooks/useNewsletter";
import {
  useNewsletterLanguages,
  useCampaignTranslations,
  useSaveCampaignTranslation,
  type CampaignTranslation,
} from "@/hooks/useNewsletterI18n";

type TranslationDraft = Omit<CampaignTranslation, "campaign_id">;

interface Props {
  campaign: NewsletterCampaign | null;
  subscriberCount: number;
  onClose: () => void;
}

export function NewsletterCampaignEditor({ campaign, subscriberCount, onClose }: Props) {
  const isReadOnly = campaign?.status === "sent" || campaign?.status === "sending";

  const [title, setTitle] = useState(campaign?.title ?? "");
  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [preheader, setPreheader] = useState(campaign?.preheader ?? "");
  const [intro, setIntro] = useState(campaign?.content_json?.intro ?? "");
  const [outro, setOutro] = useState(campaign?.content_json?.outro ?? "");
  const [productIds, setProductIds] = useState<string[]>(campaign?.product_ids ?? []);
  const [listId, setListId] = useState<string | null>(campaign?.list_id ?? null);
  const [audienceMode, setAudienceMode] = useState<string>(campaign?.audience_mode ?? "all");
  const [listIds, setListIds] = useState<string[]>(campaign?.list_ids ?? []);
  const [tags, setTags] = useState<string[]>(campaign?.tags ?? []);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(campaign?.template_id ?? null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [confirmSend, setConfirmSend] = useState(false);
  const [previewLang, setPreviewLang] = useState<string>("");
  const [translations, setTranslations] = useState<Record<string, TranslationDraft>>({});
  const [translating, setTranslating] = useState(false);
  const [productCoverage, setProductCoverage] = useState<ProductTranslationCoverage>({});
  const [translatingProducts, setTranslatingProducts] = useState(false);

  const save = useSaveCampaign();
  const send = useSendCampaign();
  const schedule = useScheduleCampaign();
  const products = usePublishableProducts();
  const lists = useLists();
  const templates = useTemplates();
  const subscribers = useSubscribers();
  const languages = useNewsletterLanguages(false);
  const savedTranslations = useCampaignTranslations(campaign?.id ?? null);
  const saveTranslation = useSaveCampaignTranslation();

  const activeLanguages = languages.data ?? [];
  const defaultLang =
    activeLanguages.find((l) => l.is_default)?.code ?? activeLanguages[0]?.code ?? "en";
  const currentLang = previewLang || defaultLang;

  useEffect(() => {
    if (!savedTranslations.data) return;
    const next: Record<string, TranslationDraft> = {};
    for (const t of savedTranslations.data) {
      next[t.language_code] = {
        language_code: t.language_code,
        subject: t.subject,
        preheader: t.preheader,
        title: t.title,
        intro: t.intro,
        outro: t.outro,
        cta_label: t.cta_label,
        footer_note: t.footer_note,
      };
    }
    setTranslations(next);
  }, [savedTranslations.data]);

  const translationPayload = useMemo(
    () =>
      Object.values(translations).filter((t) =>
        [t.subject, t.preheader, t.title, t.intro, t.outro, t.cta_label, t.footer_note].some(
          (v) => (v ?? "").toString().trim() !== "",
        ),
      ),
    [translations],
  );

  const setTranslationField = (code: string, field: keyof TranslationDraft, value: string) =>
    setTranslations((prev) => ({
      ...prev,
      [code]: {
        language_code: code,
        subject: null,
        preheader: null,
        title: null,
        intro: null,
        outro: null,
        cta_label: null,
        footer_note: null,
        ...(prev[code] ?? {}),
        [field]: value,
      } as TranslationDraft,
    }));

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const s of subscribers.data ?? []) (s.tags ?? []).forEach((t) => set.add(t));
    return [...set].sort();
  }, [subscribers.data]);

  const draft = useMemo(
    () => ({
      id: campaign?.id ?? null,
      title: title.trim() || "Sem título",
      subject: subject.trim() || "Newsletter LEGA",
      preheader: preheader.trim() || null,
      product_ids: productIds,
      content_json: { intro, outro, overrides: campaign?.content_json?.overrides ?? {} },
      list_id: listId,
      template_id: templateId,
      audience_mode: audienceMode,
      list_ids: listIds,
      tags,
    }),
    [campaign, title, subject, preheader, intro, outro, productIds, listId, templateId, audienceMode, listIds, tags],
  );

  /** Texto padrão editorial nos idiomas suportados (sem marcadores técnicos). */
  const DEFAULT_COPY: Record<
    string,
    { subject: string; preheader: string; title: string; intro: string; outro: string }
  > = {
    en: {
      subject: "LEGA — Latest stock highlights",
      preheader: "The latest arrivals in the LEGA stock.",
      title: "Latest Product Highlights",
      intro: "Discover the latest arrivals in our LEGA stock.",
      outro: "Need more information? Reply to this email or contact us.",
    },
    pt: {
      subject: "LEGA — Destaques do stock",
      preheader: "As novidades mais recentes do stock LEGA.",
      title: "Destaque de Produtos",
      intro: "Confira as novidades mais recentes do nosso stock.",
      outro: "Precisa de mais informações? Responda a este email ou contacte-nos.",
    },
    fr: {
      subject: "LEGA — Nouveautés du stock",
      preheader: "Les dernières nouveautés du stock LEGA.",
      title: "Nouveautés Produits",
      intro: "Découvrez les dernières nouveautés de notre stock LEGA.",
      outro: "Besoin de plus d'informations ? Répondez à cet email ou contactez-nous.",
    },
  };

  const [defaultTextLang, setDefaultTextLang] = useState<string>(defaultLang);

  /** Remove marcadores técnicos como "(padrão)" de nomes usados no conteúdo. */
  const cleanName = (name: string) =>
    name.replace(/\s*\((padr[aã]o|default|standard)\)\s*/gi, " ").replace(/\s+/g, " ").trim();

  const copyFor = (lang: string) => DEFAULT_COPY[lang] ?? DEFAULT_COPY.en;

  /**
   * Carrega o texto padrão no idioma escolhido e garante que cada idioma activo
   * tem a sua própria versão editorial (independente entre idiomas).
   */
  const applyDefaultText = (lang: string) => {
    setDefaultTextLang(lang);
    const c = copyFor(lang);
    setSubject(c.subject);
    setPreheader(c.preheader);
    setIntro(c.intro);
    setOutro(c.outro);

    setTranslations((prev) => {
      const next = { ...prev };
      const codes = activeLanguages.length ? activeLanguages.map((l) => l.code) : [lang];
      for (const code of codes) {
        const copy = DEFAULT_COPY[code];
        if (!copy) continue;
        const cur = prev[code];
        const keep = (v: string | null | undefined, fallback: string) =>
          code !== lang && (v ?? "").trim() !== "" ? (v as string) : fallback;
        next[code] = {
          language_code: code,
          cta_label: cur?.cta_label ?? null,
          footer_note: cur?.footer_note ?? null,
          subject: keep(cur?.subject, copy.subject),
          preheader: keep(cur?.preheader, copy.preheader),
          title: keep(cur?.title, copy.title),
          intro: keep(cur?.intro, copy.intro),
          outro: keep(cur?.outro, copy.outro),
        } as TranslationDraft;
      }
      return next;
    });

    toast({ title: "Texto padrão aplicado", description: lang.toUpperCase() });
  };

  const applyTemplate = (id: string) => {
    const tpl = (templates.data ?? []).find((t) => t.id === id);
    setTemplateId(id || null);
    if (!tpl) return;

    const tplIntro = (tpl.content_json?.intro ?? "").toString().trim();
    const tplOutro = (tpl.content_json?.outro ?? "").toString().trim();
    const name = cleanName(tpl.name);
    const c = copyFor(defaultTextLang);

    if (!title.trim()) setTitle(name);
    if (!subject.trim()) setSubject(cleanName(tpl.subject_template?.trim() || c.subject));
    if (!(preheader ?? "").trim()) setPreheader(tpl.preheader_template?.trim() || c.preheader);
    setIntro(cleanName(tplIntro) || c.intro);
    setOutro(cleanName(tplOutro) || c.outro);

    toast({ title: "Template aplicado", description: name });
  };

  const refreshPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetchCampaignPreview({
        lang: currentLang,
        translations: translationPayload as any,
        draft: {
          title: draft.title,
          subject: draft.subject,
          preheader: draft.preheader,
          product_ids: draft.product_ids,
          content_json: draft.content_json,
          template_id: templateId,
          audience_mode: audienceMode,
          list_ids: listIds,
          tags,
        },
      });
      setPreviewHtml(res.html);
      setRecipientCount(res.recipient_count ?? null);
    } catch (err: any) {
      toast({
        title: "Falha no preview",
        description: String(err?.message ?? err),
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Auto-refresh do preview (debounced) sempre que o conteúdo muda
  const previewKey = useMemo(
    () =>
      JSON.stringify({
        lang: currentLang,
        title: draft.title,
        subject: draft.subject,
        preheader: draft.preheader,
        intro,
        outro,
        product_ids: productIds,
        template_id: templateId,
        audience_mode: audienceMode,
        list_ids: listIds,
        tags,
        translations: translationPayload,
      }),
    [currentLang, draft, intro, outro, productIds, templateId, audienceMode, listIds, tags, translationPayload],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      refreshPreview();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const persistDraft = async (nextStatus?: string) => {
    return await doPersistDraft(nextStatus);
  };

  // Cobertura das traduções de produto — consulta leve, sem gerar nada.
  const refreshProductCoverage = async () => {
    if (productIds.length === 0 || activeLanguages.length === 0) {
      setProductCoverage({});
      return;
    }
    try {
      const res = await fetchProductTranslationCoverage(
        productIds,
        activeLanguages.map((l) => l.code),
      );
      setProductCoverage(res.coverage ?? {});
    } catch {
      /* silencioso — indicador é informativo */
    }
  };

  useEffect(() => {
    const t = setTimeout(refreshProductCoverage, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds.join(","), activeLanguages.map((l) => l.code).join(",")]);

  /** Gera as traduções em falta dos produtos e actualiza o preview. */
  const translateProducts = async (only?: string) => {
    if (productIds.length === 0) {
      toast({ title: "Sem produtos", description: "Selecciona produtos antes de traduzir." });
      return;
    }
    const targets = (only ? [only] : activeLanguages.map((l) => l.code)).filter(
      (c) => c !== defaultLang,
    );
    if (targets.length === 0) {
      toast({ title: "Nada a traduzir", description: "Só existe o idioma base ativo." });
      return;
    }
    setTranslatingProducts(true);
    try {
      const res = await translateCampaignProducts({ productIds, targets });
      setProductCoverage(res.coverage ?? {});
      toast({
        title: "Produtos traduzidos",
        description: targets.map((t) => t.toUpperCase()).join(", "),
      });
      await refreshPreview();
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      toast({
        title: "Falha na tradução dos produtos",
        description: msg.includes("rate_limited")
          ? "Demasiados pedidos — tenta novamente daqui a pouco."
          : msg.includes("payment_required")
            ? "Créditos de IA esgotados."
            : msg,
        variant: "destructive",
      });
    } finally {
      setTranslatingProducts(false);
    }
  };

  const autoTranslate = async (only?: string) => {
    const targets = (only ? [only] : activeLanguages.map((l) => l.code)).filter(
      (c) => c !== defaultLang,
    );
    if (targets.length === 0) {
      toast({ title: "Nada a traduzir", description: "Só existe o idioma base ativo." });
      return;
    }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("newsletter-translate", {
        body: {
          source_language: defaultLang,
          targets,
          source: {
            subject: translations[defaultLang]?.subject || subject,
            preheader: translations[defaultLang]?.preheader || preheader,
            title: translations[defaultLang]?.title || copyFor(defaultLang).title,
            intro: translations[defaultLang]?.intro || intro,
            outro: translations[defaultLang]?.outro || outro,
          },
        },
      });
      if (error) throw error;
      if (!(data as any)?.ok) throw new Error((data as any)?.error ?? "translate_failed");

      const result = (data as any).translations as Record<string, Record<string, string>>;
      setTranslations((prev) => {
        const next = { ...prev };
        for (const [code, fields] of Object.entries(result)) {
          next[code] = {
            language_code: code,
            subject: null,
            preheader: null,
            title: null,
            intro: null,
            outro: null,
            cta_label: null,
            footer_note: null,
            ...(prev[code] ?? {}),
            ...fields,
          } as TranslationDraft;
        }
        return next;
      });
      toast({
        title: "Traduções geradas",
        description: targets.map((t) => t.toUpperCase()).join(", "),
      });
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      toast({
        title: "Falha na tradução automática",
        description:
          msg.includes("rate_limited")
            ? "Demasiados pedidos — tenta novamente daqui a pouco."
            : msg.includes("payment_required")
              ? "Créditos de IA esgotados."
              : msg,
        variant: "destructive",
      });
    } finally {
      setTranslating(false);
    }
  };

  const doPersistDraft = async (nextStatus?: string) => {
    const saved = await save.mutateAsync({ ...draft, status: nextStatus ?? campaign?.status ?? "draft" });
    for (const t of translationPayload) {
      await saveTranslation.mutateAsync({ ...t, campaign_id: saved.id });
    }
    toast({ title: "Rascunho guardado", description: `Campanha "${saved.title}" atualizada.` });
    return saved;
  };

  const toggleProduct = (id: string) => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const moveProduct = (id: string, dir: -1 | 1) => {
    setProductIds((prev) => {
      const i = prev.indexOf(id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const [productSearch, setProductSearch] = useState("");
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = products.data ?? [];
    if (!q) return list;
    return list.filter((p: any) =>
      (p.title as string)?.toLowerCase().includes(q) ||
      (p.brand?.name as string)?.toLowerCase().includes(q),
    );
  }, [products.data, productSearch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div>
            <h3 className="text-lg font-semibold">
              {campaign ? (isReadOnly ? "Ver campanha" : "Editar campanha") : "Nova campanha"}
            </h3>
            {campaign && (
              <p className="text-xs text-muted-foreground">Estado atual: <Badge variant="secondary">{campaign.status}</Badge></p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshPreview} disabled={previewLoading}>
            {previewLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Atualizar preview
          </Button>
          {!isReadOnly && (
            <>
              <Button variant="outline" onClick={() => persistDraft("draft")} disabled={save.isPending}>
                <Save className="h-4 w-4 mr-1" /> Guardar rascunho
              </Button>
              <Button variant="outline" onClick={() => setScheduleOpen(true)} disabled={save.isPending}>
                <CalendarClock className="h-4 w-4 mr-1" /> Agendar
              </Button>
              <Button
                onClick={async () => {
                  const saved = await persistDraft("ready");
                  if (productIds.length === 0) {
                    toast({ title: "Sem produtos", description: "Adiciona pelo menos um produto antes de enviar.", variant: "destructive" });
                    return;
                  }
                  campaign = saved;
                  setConfirmSend(true);
                }}
                disabled={save.isPending}
              >
                <Send className="h-4 w-4 mr-1" /> Enviar…
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-4">
        {/* Editor */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Conteúdo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Título interno</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Assunto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isReadOnly} maxLength={140} />
              </div>
              <div>
                <Label>Preheader (opcional)</Label>
                <Input value={preheader ?? ""} onChange={(e) => setPreheader(e.target.value)} disabled={isReadOnly} maxLength={140} />
              </div>
              <div>
                <Label>Introdução</Label>
                <Textarea rows={4} value={intro} onChange={(e) => setIntro(e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Fecho</Label>
                <Textarea rows={3} value={outro} onChange={(e) => setOutro(e.target.value)} disabled={isReadOnly} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" /> Traduções ({currentLang.toUpperCase()})
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Cada idioma é enviado como um email independente. Campos vazios usam o conteúdo
                original ({defaultLang.toUpperCase()}).
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isReadOnly && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={translating} onClick={() => autoTranslate()}>
                    {translating ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Languages className="h-4 w-4 mr-1" />
                    )}
                    Traduzir automaticamente (todos)
                  </Button>
                  {currentLang !== defaultLang && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={translating}
                      onClick={() => autoTranslate(currentLang)}
                    >
                      Traduzir só {currentLang.toUpperCase()}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={translatingProducts || productIds.length === 0}
                    onClick={() => translateProducts()}
                  >
                    {translatingProducts ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Languages className="h-4 w-4 mr-1" />
                    )}
                    Traduzir produtos
                  </Button>
                  {currentLang !== defaultLang && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={translatingProducts || productIds.length === 0}
                      onClick={() => translateProducts(currentLang)}
                    >
                      Produtos só {currentLang.toUpperCase()}
                    </Button>
                  )}
                </div>
              )}
              {productIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Produtos traduzidos:</span>
                  {activeLanguages.map((l) => {
                    const c = productCoverage[l.code];
                    const done = l.code === defaultLang ? productIds.length : (c?.translated ?? 0);
                    return (
                      <Badge
                        key={l.code}
                        variant={done >= productIds.length ? "default" : "outline"}
                      >
                        {l.code.toUpperCase()} {done}/{productIds.length}
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {activeLanguages.map((l) => (
                  <Badge
                    key={l.code}
                    variant={l.code === currentLang ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPreviewLang(l.code)}
                  >
                    {l.flag_emoji ? `${l.flag_emoji} ` : ""}{l.native_label}
                  </Badge>
                ))}
              </div>

              <>
                  {currentLang === defaultLang && (
                    <p className="text-xs text-muted-foreground">
                      Idioma base — estes campos substituem o conteúdo do cartão acima nesta língua.
                    </p>
                  )}
                  <div>
                    <Label>Assunto</Label>
                    <Input
                      value={translations[currentLang]?.subject ?? ""}
                      placeholder={subject}
                      disabled={isReadOnly}
                      onChange={(e) => setTranslationField(currentLang, "subject", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Preheader</Label>
                    <Input
                      value={translations[currentLang]?.preheader ?? ""}
                      placeholder={preheader ?? ""}
                      disabled={isReadOnly}
                      onChange={(e) => setTranslationField(currentLang, "preheader", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Título editorial</Label>
                    <Input
                      value={translations[currentLang]?.title ?? ""}
                      placeholder={copyFor(currentLang).title}
                      disabled={isReadOnly}
                      onChange={(e) => setTranslationField(currentLang, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Introdução</Label>
                    <Textarea
                      rows={4}
                      value={translations[currentLang]?.intro ?? ""}
                      placeholder={intro}
                      disabled={isReadOnly}
                      onChange={(e) => setTranslationField(currentLang, "intro", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Fecho</Label>
                    <Textarea
                      rows={3}
                      value={translations[currentLang]?.outro ?? ""}
                      placeholder={outro}
                      disabled={isReadOnly}
                      onChange={(e) => setTranslationField(currentLang, "outro", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Botão (CTA)</Label>
                      <Input
                        value={translations[currentLang]?.cta_label ?? ""}
                        disabled={isReadOnly}
                        onChange={(e) => setTranslationField(currentLang, "cta_label", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Nota de rodapé</Label>
                      <Input
                        value={translations[currentLang]?.footer_note ?? ""}
                        disabled={isReadOnly}
                        onChange={(e) => setTranslationField(currentLang, "footer_note", e.target.value)}
                      />
                    </div>
                  </div>
                </>

            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Destinatários e template</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Audiência</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={audienceMode}
                  disabled={isReadOnly}
                  onChange={(e) => setAudienceMode(e.target.value)}
                >
                  <option value="all">Todos os subscritores ativos</option>
                  <option value="lists">Listas selecionadas</option>
                  <option value="tags">Etiquetas selecionadas</option>
                  <option value="mixed">Listas + etiquetas (união)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Cada subscritor recebe um email individual com link de cancelamento próprio. Destinatários repetidos são eliminados automaticamente.
                </p>
              </div>

              {(audienceMode === "lists" || audienceMode === "mixed") && (
                <div>
                  <Label>Listas</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(lists.data ?? []).filter((l) => l.is_active && !l.archived_at).map((l) => {
                      const on = listIds.includes(l.id);
                      return (
                        <Badge
                          key={l.id}
                          variant={on ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() =>
                            !isReadOnly &&
                            setListIds((prev) => (on ? prev.filter((x) => x !== l.id) : [...prev, l.id]))
                          }
                        >
                          {l.name}
                        </Badge>
                      );
                    })}
                    {(lists.data ?? []).length === 0 && (
                      <span className="text-xs text-muted-foreground">Ainda não existem listas.</span>
                    )}
                  </div>
                </div>
              )}

              {(audienceMode === "tags" || audienceMode === "mixed") && (
                <div>
                  <Label>Etiquetas</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {allTags.map((t) => {
                      const on = tags.includes(t);
                      return (
                        <Badge
                          key={t}
                          variant={on ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() =>
                            !isReadOnly &&
                            setTags((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))
                          }
                        >
                          {t}
                        </Badge>
                      );
                    })}
                    {allTags.length === 0 && (
                      <span className="text-xs text-muted-foreground">Sem etiquetas nos subscritores.</span>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
                Destinatários estimados:{" "}
                <strong>{recipientCount ?? "—"}</strong>{" "}
                <span className="text-muted-foreground">(atualiza com o preview)</span>
              </div>
              <div>
                <Label>Template base</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={templateId ?? ""}
                  disabled={isReadOnly}
                  onChange={(e) => applyTemplate(e.target.value)}
                >
                  <option value="">Sem template</option>
                  {(templates.data ?? []).filter((t) => t.is_active).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Texto padrão</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={defaultTextLang}
                  disabled={isReadOnly}
                  onChange={(e) => applyDefaultText(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="fr">Français</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Carrega automaticamente o texto pré-definido no idioma escolhido.
                </p>
              </div>

              <div>
                <Label>Enviar teste para</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="email"
                    placeholder="email@exemplo.pt"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    disabled={!testEmail.trim() || testSending}
                    onClick={async () => {
                      setTestSending(true);
                      try {
                        await sendTestEmail({
                          test_email: testEmail.trim(),
                          lang: currentLang,
                          translations: translationPayload as any,
                          draft: {
                            title: draft.title,
                            subject: draft.subject,
                            preheader: draft.preheader,
                            product_ids: draft.product_ids,
                            content_json: draft.content_json,
                            template_id: templateId,
                          },
                        });
                        toast({ title: "Teste enviado", description: testEmail.trim() });
                      } catch (err: any) {
                        toast({ title: "Falha no envio de teste", description: String(err?.message ?? err), variant: "destructive" });
                      } finally {
                        setTestSending(false);
                      }
                    }}
                  >
                    {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Produtos ({productIds.length})</span>
                <Input
                  placeholder="Pesquisar…"
                  className="w-40 h-8 text-xs"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {productIds.length > 0 && (
                <div className="p-3 border-b space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Ordem no email</p>
                  {productIds.map((id, idx) => {
                    const p = (products.data ?? []).find((x: any) => x.id === id) as any;
                    return (
                      <div key={id} className="flex items-center gap-2 text-sm">
                        <span className="w-5 text-xs text-muted-foreground">{idx + 1}.</span>
                        <span className="flex-1 truncate">{p?.title ?? id}</span>
                        {!isReadOnly && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => moveProduct(id, -1)}>↑</Button>
                            <Button size="sm" variant="ghost" onClick={() => moveProduct(id, 1)}>↓</Button>
                            <Button size="sm" variant="ghost" onClick={() => toggleProduct(id)}>×</Button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <ScrollArea className="h-64">
                <div className="p-3 space-y-1">
                  {filteredProducts.map((p: any) => {
                    const selected = productIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => toggleProduct(p.id)}
                        className={`w-full text-left flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent ${selected ? "bg-accent/60 font-medium" : ""}`}
                      >
                        <input type="checkbox" readOnly checked={selected} />
                        <span className="flex-1 truncate">{p.title}</span>
                        {p.brand?.name && (
                          <span className="text-xs text-muted-foreground">{p.brand.name}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Preview</CardTitle>
            <div className="flex items-center gap-1">
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm mr-1"
                value={currentLang}
                onChange={(e) => setPreviewLang(e.target.value)}
              >
                {activeLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag_emoji ? `${l.flag_emoji} ` : ""}{l.native_label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant={previewDevice === "desktop" ? "default" : "outline"}
                onClick={() => setPreviewDevice("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={previewDevice === "mobile" ? "default" : "outline"}
                onClick={() => setPreviewDevice("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="bg-muted p-4">
            <div className={`mx-auto bg-white shadow-sm transition-all ${previewDevice === "mobile" ? "max-w-[380px]" : "max-w-[680px]"}`}>
              {previewHtml ? (
                <iframe
                  title="preview"
                  srcDoc={previewHtml}
                  className="w-full"
                  style={{ height: "70vh", border: 0 }}
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {previewLoading ? "A gerar preview…" : "Preview indisponível"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha <strong>{draft.title}</strong> será enviada para{" "}
              <strong>{recipientCount ?? subscriberCount}</strong> subscritores da audiência selecionada.
              Assunto: <em>{draft.subject}</em>. Confirmas o envio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmSend(false);
                const saved = campaign ?? (await persistDraft("ready"));
                const res = await send.mutateAsync(saved.id);
                if ((res as any)?.ok) {
                  toast({ title: "Envio agendado", description: "A campanha entrou na fila de envio." });
                  onClose();
                } else {
                  toast({
                    title: "Falha ao agendar envio",
                    description: String((res as any)?.error ?? "Erro desconhecido"),
                    variant: "destructive",
                  });
                }
              }}
            >
              Enviar agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agendar envio</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha entra na fila com estado <em>scheduled</em> e é enviada automaticamente na data escolhida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1">
            <Label>Data e hora</Label>
            <Input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!scheduleAt}
              onClick={async () => {
                const when = new Date(scheduleAt);
                if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
                  toast({ title: "Data inválida", description: "Escolhe uma data futura.", variant: "destructive" });
                  return;
                }
                setScheduleOpen(false);
                const saved = await persistDraft("ready");
                await schedule.mutateAsync({ campaignId: saved.id, when: when.toISOString() });
                toast({ title: "Envio agendado", description: when.toLocaleString("pt-PT") });
                onClose();
              }}
            >
              Agendar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}