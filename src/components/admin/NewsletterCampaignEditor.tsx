import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Loader2, Monitor, Save, Send, Smartphone, TestTube2 } from "lucide-react";
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
  useLists,
  useTemplates,
  useSubscribers,
  type NewsletterCampaign,
} from "@/hooks/useNewsletter";

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

  const save = useSaveCampaign();
  const send = useSendCampaign();
  const schedule = useScheduleCampaign();
  const products = usePublishableProducts();
  const lists = useLists();
  const templates = useTemplates();
  const subscribers = useSubscribers();

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

  const applyTemplate = (id: string) => {
    const tpl = (templates.data ?? []).find((t) => t.id === id);
    setTemplateId(id || null);
    if (!tpl) return;
    if (tpl.subject_template && !subject.trim()) setSubject(tpl.subject_template);
    if (tpl.preheader_template && !preheader) setPreheader(tpl.preheader_template);
    if (tpl.content_json?.intro) setIntro(tpl.content_json.intro);
    if (tpl.content_json?.outro) setOutro(tpl.content_json.outro);
    toast({ title: "Template aplicado", description: tpl.name });
  };

  const refreshPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetchCampaignPreview({
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

  // Load initial preview
  useEffect(() => {
    refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistDraft = async (nextStatus?: string) => {
    const saved = await save.mutateAsync({ ...draft, status: nextStatus ?? campaign?.status ?? "draft" });
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
            <CardHeader><CardTitle className="text-base">Destinatários e template</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Lista de destinatários</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={listId ?? ""}
                  disabled={isReadOnly}
                  onChange={(e) => setListId(e.target.value || null)}
                >
                  <option value="">Audiência completa (Resend broadcast)</option>
                  {(lists.data ?? []).filter((l) => l.is_active).map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedList
                    ? "Envio segmentado: cada subscritor recebe um email individual com link de cancelamento próprio."
                    : "Envio para toda a audiência configurada no Resend."}
                </p>
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
              A campanha <strong>{draft.title}</strong> será enviada para <strong>{subscriberCount}</strong> subscritores ativos.
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
    </div>
  );
}