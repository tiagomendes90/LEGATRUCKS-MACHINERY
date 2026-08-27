import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Copy, History, Loader2, Mail, Plus, RefreshCw, Send, Trash2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useCampaigns,
  useSubscribers,
  useSubscriberStats,
  useSaveCampaign,
  useSendCampaign,
  useCancelCampaign,
  useDeleteCampaign,
  useAdminUnsubscribe,
  useCampaignSends,
  useDuplicateCampaign,
  useRetryFailedSends,
  useNewsletterAudit,
  useLists,
  useListMemberCounts,
  type NewsletterCampaign,
} from "@/hooks/useNewsletter";
import { NewsletterCampaignEditor } from "./NewsletterCampaignEditor";
import NewsletterListsPanel from "./NewsletterListsPanel";
import NewsletterTemplatesPanel from "./NewsletterTemplatesPanel";
import NewsletterLanguagesPanel from "./NewsletterLanguagesPanel";
import { usePersistentState } from "@/hooks/usePersistentState";

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
    ready: { label: "Pronto", className: "bg-blue-100 text-blue-700" },
    scheduled: { label: "Agendado", className: "bg-amber-100 text-amber-700" },
    sending: { label: "A enviar…", className: "bg-amber-100 text-amber-700" },
    sent: { label: "Enviado", className: "bg-emerald-100 text-emerald-700" },
    failed: { label: "Falhou", className: "bg-destructive/10 text-destructive" },
    canceled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={cfg.className} variant="secondary">{cfg.label}</Badge>;
}

export default function NewsletterPanel() {
  const [tab, setTab] = usePersistentState<string>("newsletter.tab", "campaigns");
  const [editing, setEditing] = useState<NewsletterCampaign | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [confirmSend, setConfirmSend] = useState<NewsletterCampaign | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NewsletterCampaign | null>(null);

  const campaigns = useCampaigns();
  const subscribers = useSubscribers();
  const stats = useSubscriberStats();
  const lists = useLists();
  const listCounts = useListMemberCounts();
  const save = useSaveCampaign();
  const send = useSendCampaign();
  const cancel = useCancelCampaign();
  const duplicate = useDuplicateCampaign();
  const retryFailed = useRetryFailedSends();
  const del = useDeleteCampaign();
  const adminUnsub = useAdminUnsubscribe();
  const [campaignFilter, setCampaignFilter] = usePersistentState<string>("newsletter.campaigns.filter", "all");

  const listById = useMemo(
    () => Object.fromEntries((lists.data ?? []).map((l) => [l.id, l])),
    [lists.data],
  );

  const audienceLabel = (c: NewsletterCampaign) => {
    const ids = [...(c.list_ids ?? []), c.list_id].filter(Boolean) as string[];
    if (c.audience_mode === "all") return "Todos os subscritores";
    if (ids.length > 0) {
      const names = [...new Set(ids)].map((id) => listById[id]?.name ?? "lista removida");
      return names.join(", ");
    }
    return `${c.tags?.length ?? 0} etiqueta(s)`;
  };

  const recipientsFor = (c: NewsletterCampaign | null) => {
    if (!c) return 0;
    if (c.recipients_count) return c.recipients_count;
    const ids = [...new Set([...(c.list_ids ?? []), c.list_id].filter(Boolean) as string[])];
    if (c.audience_mode === "all" || ids.length === 0) return stats.data?.active ?? 0;
    return ids.reduce((sum, id) => sum + (listCounts.data?.[id]?.active ?? 0), 0);
  };

  const filteredCampaigns = useMemo(() => {
    const all = campaigns.data ?? [];
    if (campaignFilter === "drafts") return all.filter((c) => c.status === "draft" || c.status === "ready");
    if (campaignFilter === "scheduled") return all.filter((c) => c.status === "scheduled");
    if (campaignFilter === "sent") return all.filter((c) => c.status === "sent" || c.status === "sending");
    return all;
  }, [campaigns.data, campaignFilter]);

  const isEditing = editing !== null || creatingNew;

  if (isEditing) {
    return (
      <NewsletterCampaignEditor
        campaign={editing}
        subscriberCount={stats.data?.active ?? 0}
        onClose={() => {
          setEditing(null);
          setCreatingNew(false);
        }}
      />
    );
  }

  const counts = useMemo(() => {
    const all = campaigns.data ?? [];
    return {
      total: all.length,
      drafts: all.filter((c) => c.status === "draft" || c.status === "ready").length,
      scheduled: all.filter((c) => c.status === "scheduled").length,
      sent: all.filter((c) => c.status === "sent" || c.status === "sending").length,
    };
  }, [campaigns.data]);

  const secondaryTabs: [string, string][] = [
    ["history", "Histórico"],
    ["templates", "Templates"],
    ["languages", "Idiomas"],
    ["audit", "Auditoria"],
  ];
  const secondaryLabel = secondaryTabs.find(([v]) => v === tab)?.[1];

  return (
    <div className="space-y-5">
      {/* Barra de estatísticas compacta */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-2.5 text-sm">
        {[
          ["Ativos", stats.data?.active ?? "—"],
          ["Cancelados", stats.data?.unsubscribed ?? "—"],
          ["Bounces", stats.data?.bounced ?? 0],
          ["Campanhas", campaigns.data?.length ?? "—"],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-baseline gap-1.5">
            <span className="font-semibold">
              {typeof value === "number" ? value.toLocaleString("pt-PT") : value}
            </span>
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="lists">Listas</TabsTrigger>
            <TabsTrigger value="subscribers">Contactos</TabsTrigger>
          </TabsList>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={secondaryLabel ? "default" : "outline"} size="sm">
                {secondaryLabel ?? "Mais"} <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {secondaryTabs.map(([value, label]) => (
                <DropdownMenuItem key={value} onSelect={() => setTab(value)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Campanhas */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Newsletter</h3>
              <p className="text-sm text-muted-foreground">
                O envio requer sempre confirmação manual. Nada é enviado automaticamente.
              </p>
            </div>
            <Button size="lg" onClick={() => setCreatingNew(true)}>
              <Plus className="h-4 w-4 mr-2" /> Criar nova newsletter
            </Button>
          </div>

          {/* Resumo + filtro (dupla função) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {([
              ["all", "Total de campanhas", counts.total],
              ["drafts", "Rascunhos", counts.drafts],
              ["scheduled", "Agendadas", counts.scheduled],
              ["sent", "Enviadas", counts.sent],
            ] as [string, string, number][]).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCampaignFilter(value)}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  campaignFilter === value ? "border-primary bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{count}</p>
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead className="hidden md:table-cell">Produtos</TableHead>
                    <TableHead className="hidden md:table-cell">Lista</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden lg:table-cell">Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> A carregar…
                      </TableCell>
                    </TableRow>
                  ) : filteredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        Nenhuma campanha nesta secção.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns.map((c) => {
                      const isSent = c.status === "sent" || c.status === "sending";
                      const isScheduled = c.status === "scheduled";
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-[240px]">
                            {c.subject}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{c.product_ids?.length ?? 0}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                            {audienceLabel(c)}
                          </TableCell>
                          <TableCell>{statusBadge(c.status)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: pt })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                                {isSent ? "Ver" : "Editar"}
                              </Button>
                              {!isSent && !isScheduled && (
                                <Button
                                  size="sm"
                                  onClick={() => setConfirmSend(c)}
                                  disabled={c.product_ids?.length === 0}
                                >
                                  <Send className="h-3.5 w-3.5 mr-1" /> Enviar
                                </Button>
                              )}
                              {isScheduled && (
                                <Button size="sm" variant="outline" onClick={() => cancel.mutate(c.id)}>
                                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" aria-label="Mais ações">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => duplicate.mutate(c)}>
                                    <Copy className="h-4 w-4 mr-2" /> Duplicar
                                  </DropdownMenuItem>
                                  {c.status === "sending" && (
                                    <DropdownMenuItem onSelect={() => cancel.mutate(c.id)}>
                                      <XCircle className="h-4 w-4 mr-2" /> Cancelar envio
                                    </DropdownMenuItem>
                                  )}
                                  {(c.failed_count ?? 0) > 0 && c.status !== "sending" && (
                                    <DropdownMenuItem
                                      onSelect={async () => {
                                        await retryFailed.mutateAsync(c.id);
                                        toast({
                                          title: "Reenvio na fila",
                                          description: "Apenas os destinatários falhados serão contactados.",
                                        });
                                      }}
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" /> Reenviar falhados (
                                      {c.failed_count})
                                    </DropdownMenuItem>
                                  )}
                                  {c.status !== "sent" && (
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onSelect={() => setConfirmDelete(c)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="lists">
          <NewsletterListsPanel />
        </TabsContent>

        <TabsContent value="templates">
          <NewsletterTemplatesPanel />
        </TabsContent>

        <TabsContent value="languages">
          <NewsletterLanguagesPanel />
        </TabsContent>

        {/* Subscritores */}
        <TabsContent value="subscribers" className="space-y-4">
          <SubscribersTable
            subscribers={subscribers.data ?? []}
            loading={subscribers.isLoading}
            onUnsubscribe={(id) => adminUnsub.mutate(id)}
          />
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className="space-y-4">
          <HistoryPanel campaigns={campaigns.data ?? []} />
        </TabsContent>

        {/* Auditoria */}
        <TabsContent value="audit" className="space-y-4">
          <AuditPanel />
        </TabsContent>
      </Tabs>

      {/* Confirm send */}
      <AlertDialog open={!!confirmSend} onOpenChange={(o) => !o && setConfirmSend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p><strong>Lista:</strong> {confirmSend ? audienceLabel(confirmSend) : "—"}</p>
                <p><strong>Destinatários:</strong> {recipientsFor(confirmSend).toLocaleString("pt-PT")}</p>
                <p><strong>Idioma principal:</strong> English</p>
                <p><strong>Assunto:</strong> {confirmSend?.subject}</p>
                <p className="pt-2">Tem a certeza de que pretende enviar esta newsletter? Esta ação é irreversível.</p>
              </div>
            </AlertDialogDescription>

          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmSend) return;
                const c = confirmSend;
                setConfirmSend(null);
                const res = await send.mutateAsync(c.id);
                if ((res as any)?.ok) {
                  toast({ title: "Envio agendado", description: "A campanha entrou na fila de envio." });
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

      {/* Confirm delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Vais eliminar <strong>{confirmDelete?.title}</strong>. Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                await del.mutateAsync(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SubscribersTable({
  subscribers,
  loading,
  onUnsubscribe,
}: {
  subscribers: ReturnType<typeof useSubscribers>["data"];
  loading: boolean;
  onUnsubscribe: (id: string) => void;
}) {
  const [filter, setFilter] = usePersistentState<string>("newsletter.subscribers.filter", "");
  const list = useMemo(() => {
    if (!subscribers) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) =>
      s.email.toLowerCase().includes(q) ||
      (s.first_name ?? "").toLowerCase().includes(q) ||
      (s.last_name ?? "").toLowerCase().includes(q),
    );
  }, [subscribers, filter]);

  const exportCsv = () => {
    const rows = [
      ["email", "first_name", "last_name", "status", "subscribed_at", "source"],
      ...list.map((s) => [
        s.email,
        s.first_name ?? "",
        s.last_name ?? "",
        s.status,
        s.subscribed_at,
        s.source,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Subscritores</CardTitle>
          <CardDescription>{list.length} subscritores</CardDescription>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Filtrar por email ou nome…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={exportCsv}>Exportar CSV</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Subscrito em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> A carregar…
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum subscritor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.email}</TableCell>
                  <TableCell>{[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.subscribed_at).toLocaleDateString("pt-PT")}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === "active" && (
                      <Button size="sm" variant="ghost" onClick={() => onUnsubscribe(s.id)}>
                        Cancelar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function HistoryPanel({ campaigns }: { campaigns: NewsletterCampaign[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const sends = useCampaignSends(selected);
  const campaign = campaigns.find((c) => c.id === selected) ?? null;
  const failed = (sends.data ?? []).filter((s) => s.status === "failed");
  const succeeded = (sends.data ?? []).filter((s) => s.status === "sent");
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campanhas enviadas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns.filter((c) => c.status === "sent" || c.status === "failed").length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum histórico ainda.</p>
          ) : (
            <ul className="divide-y">
              {campaigns
                .filter((c) => c.status === "sent" || c.status === "failed")
                .map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c.id)}
                      className={`w-full text-left p-3 text-sm hover:bg-accent ${selected === c.id ? "bg-accent" : ""}`}
                    >
                      <div className="font-medium truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground flex justify-between mt-1">
                        <span>{c.sent_at ? new Date(c.sent_at).toLocaleString("pt-PT") : "—"}</span>
                        {statusBadge(c.status)}
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Detalhe de envios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Seleciona uma campanha para ver o histórico técnico.</p>
          ) : sends.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {campaign && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {[
                    ["Audiência", campaign.recipients_count ?? 0],
                    ["Entregues", campaign.delivered_count ?? succeeded.length],
                    ["Falhados", campaign.failed_count ?? failed.length],
                    ["Abertos", campaign.opened_count ?? 0],
                    ["Cliques", campaign.clicked_count ?? 0],
                    ["Início", campaign.send_started_at ? new Date(campaign.send_started_at).toLocaleString("pt-PT") : "—"],
                    ["Fim", campaign.send_finished_at ? new Date(campaign.send_finished_at).toLocaleString("pt-PT") : "—"],
                    ["Duração", campaign.duration_ms != null ? `${(campaign.duration_ms / 1000).toFixed(1)}s` : "—"],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-md border p-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium truncate">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
              {(sends.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Sem registos de envio individuais.</p>
              )}
              {failed.length > 0 && (
                <p className="text-sm text-destructive">{failed.length} envios falhados — usa "Reenviar falhados" na lista de campanhas.</p>
              )}
              {(sends.data ?? []).slice(0, 50).map((s) => (
              <div key={s.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium capitalize">{s.status}</span>
                    {s.recipients_count != null && (
                      <span className="text-muted-foreground"> · {s.recipients_count} destinatários</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString("pt-PT")}
                  </span>
                </div>
                {s.error && <p className="mt-2 text-sm text-destructive">{s.error}</p>}
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Resposta do Resend</summary>
                  <pre className="mt-2 bg-muted p-2 rounded overflow-auto max-h-64">
                    {JSON.stringify(s.raw_response, null, 2)}
                  </pre>
                </details>
              </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Histórico completo de atividade (triggers SQL + ações do admin). */
function AuditPanel() {
  const audit = useNewsletterAudit();
  const labels: Record<string, string> = {
    "campaign.created": "Campanha criada",
    "campaign.updated": "Campanha editada",
    "campaign.status_changed": "Estado alterado",
    "campaign.deleted": "Campanha eliminada",
    "campaign.test_sent": "Email de teste enviado",
    "list.created": "Lista criada",
    "list.updated": "Lista editada",
    "list.deleted": "Lista eliminada",
    "template.created": "Template criado",
    "template.updated": "Template editado",
    "template.deleted": "Template eliminado",
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" /> Auditoria
        </CardTitle>
        <CardDescription>Registo completo de criações, edições, envios, agendamentos e cancelamentos.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> A carregar…
                </TableCell>
              </TableRow>
            ) : (audit.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Sem atividade registada.
                </TableCell>
              </TableRow>
            ) : (
              (audit.data ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString("pt-PT")}
                  </TableCell>
                  <TableCell className="capitalize">{a.entity_type}</TableCell>
                  <TableCell>{labels[a.action] ?? a.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[420px] truncate">
                    {JSON.stringify(a.details)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}