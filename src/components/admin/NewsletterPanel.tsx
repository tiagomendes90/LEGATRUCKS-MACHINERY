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
import { Copy, Loader2, Mail, Plus, Send, Trash2, XCircle } from "lucide-react";
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
  type NewsletterCampaign,
} from "@/hooks/useNewsletter";
import { NewsletterCampaignEditor } from "./NewsletterCampaignEditor";
import NewsletterListsPanel from "./NewsletterListsPanel";
import NewsletterTemplatesPanel from "./NewsletterTemplatesPanel";

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
  const [tab, setTab] = useState("campaigns");
  const [editing, setEditing] = useState<NewsletterCampaign | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [confirmSend, setConfirmSend] = useState<NewsletterCampaign | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NewsletterCampaign | null>(null);

  const campaigns = useCampaigns();
  const subscribers = useSubscribers();
  const stats = useSubscriberStats();
  const save = useSaveCampaign();
  const send = useSendCampaign();
  const cancel = useCancelCampaign();
  const duplicate = useDuplicateCampaign();
  const del = useDeleteCampaign();
  const adminUnsub = useAdminUnsubscribe();

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

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Subscritores ativos</p>
            <p className="text-2xl font-bold">{stats.data?.active ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cancelados</p>
            <p className="text-2xl font-bold">{stats.data?.unsubscribed ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Bounces</p>
            <p className="text-2xl font-bold">{stats.data?.bounced ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Campanhas totais</p>
            <p className="text-2xl font-bold">{campaigns.data?.length ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="lists">Listas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="subscribers">Subscritores</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Campanhas */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Campanhas</h3>
              <p className="text-sm text-muted-foreground">
                O envio requer sempre confirmação manual. Nada é enviado automaticamente.
              </p>
            </div>
            <Button onClick={() => setCreatingNew(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova campanha
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> A carregar…
                      </TableCell>
                    </TableRow>
                  ) : (campaigns.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Ainda não existem campanhas. Cria a primeira newsletter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (campaigns.data ?? []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[240px]">
                          {c.subject}
                        </TableCell>
                        <TableCell>{c.product_ids?.length ?? 0}</TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: pt })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                            {c.status === "sent" ? "Ver" : "Editar"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => duplicate.mutate(c)} title="Duplicar">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          {c.status !== "sent" && c.status !== "sending" && (
                            <Button
                              size="sm"
                              onClick={() => setConfirmSend(c)}
                              disabled={c.product_ids?.length === 0}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" /> Enviar
                            </Button>
                          )}
                          {(c.status === "scheduled" || c.status === "sending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancel.mutate(c.id)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                            </Button>
                          )}
                          {c.status !== "sent" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDelete(c)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
        </TabsContent>

        <TabsContent value="lists">
          <NewsletterListsPanel />
        </TabsContent>

        <TabsContent value="templates">
          <NewsletterTemplatesPanel />
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
      </Tabs>

      {/* Confirm send */}
      <AlertDialog open={!!confirmSend} onOpenChange={(o) => !o && setConfirmSend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio da campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Vais enviar <strong>{confirmSend?.title}</strong> para{" "}
              <strong>{stats.data?.active ?? 0}</strong> subscritores ativos.
              Assunto: <em>{confirmSend?.subject}</em>. Esta ação é irreversível.
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
  const [filter, setFilter] = useState("");
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
          ) : (sends.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registos.</p>
          ) : (
            (sends.data ?? []).map((s) => (
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}