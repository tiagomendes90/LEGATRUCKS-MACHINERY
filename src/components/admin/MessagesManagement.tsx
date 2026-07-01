import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Trash2, Mail, MessageSquare, Phone, ExternalLink, Inbox, MailOpen, CheckCheck, Archive,
} from 'lucide-react';
import {
  ContactMessage, MessageStatus,
  useContactMessages, useDeleteContactMessage, useUpdateContactMessage,
} from '@/hooks/useContactMessages';

const STATUS_LABEL: Record<MessageStatus, string> = {
  unread: 'Nova',
  read: 'Lida',
  answered: 'Respondida',
  archived: 'Arquivada',
};

const STATUS_BADGE: Record<MessageStatus, string> = {
  unread: 'bg-primary text-primary-foreground',
  read: 'bg-muted text-muted-foreground',
  answered: 'bg-accent text-accent-foreground',
  archived: 'bg-secondary text-secondary-foreground opacity-75',
};

const SOURCE_LABEL: Record<string, string> = {
  vehicle: 'Contacto de Veículo',
  general: 'Contacto Geral',
  quote: 'Pedido de Orçamento',
  parts: 'Pedido de Peças',
  sell_equipment: 'Venda de Equipamento',
  other: 'Outro',
};

const sourceLabel = (s: string) =>
  SOURCE_LABEL[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const humanizeKey = (k: string) =>
  k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const renderMetaValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number' || typeof v === 'string') return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
};

const StatusBadge = ({ status }: { status: MessageStatus }) => (
  <Badge className={STATUS_BADGE[status] || ''}>{STATUS_LABEL[status] || status}</Badge>
);

const MessagesManagement = () => {
  const { data: messages = [], isLoading } = useContactMessages();
  const updateMutation = useUpdateContactMessage();
  const deleteMutation = useDeleteContactMessage();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    messages.forEach((m) => set.add(m.source));
    return Array.from(set);
  }, [messages]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null;
    return messages.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && m.source !== sourceFilter) return false;
      const t = new Date(m.created_at).getTime();
      if (from && t < from) return false;
      if (to && t > to) return false;
      if (term) {
        const meta = m.metadata ? JSON.stringify(m.metadata).toLowerCase() : '';
        const hay = [
          m.name, m.email, m.phone, m.message, m.vehicle_title,
          sourceLabel(m.source), STATUS_LABEL[m.status], meta,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [messages, search, statusFilter, sourceFilter, dateFrom, dateTo]);

  const total = messages.length;
  const novas = messages.filter((m) => m.status === 'unread').length;
  const porResponder = messages.filter((m) => m.status === 'unread' || m.status === 'read').length;
  const respondidas = messages.filter((m) => m.status === 'answered').length;

  const openMessage = (m: ContactMessage) => {
    setSelected(m);
    if (m.status === 'unread') {
      updateMutation.mutate({ id: m.id, updates: { status: 'read' } });
    }
  };

  const changeStatus = (id: string, status: MessageStatus) => {
    updateMutation.mutate({ id, updates: { status } });
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Mensagens</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent></Card>
        <Card className="border-primary/30"><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Novas</p>
              <p className="text-2xl font-bold text-primary">{novas}</p>
            </div>
            <MailOpen className="h-8 w-8 text-primary" />
          </div>
        </CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Por responder</p>
              <p className="text-2xl font-bold text-destructive">{porResponder}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-destructive" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Respondidas</p>
              <p className="text-2xl font-bold">{respondidas}</p>
            </div>
            <CheckCheck className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensagens recebidas</CardTitle>
          <CardDescription>Centro único de contactos do website — adapta-se automaticamente a novos tipos de formulário.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar nome, email, telefone, veículo, origem, estado..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="unread">Nova</SelectItem>
                <SelectItem value="read">Lida</SelectItem>
                <SelectItem value="answered">Respondida</SelectItem>
                <SelectItem value="archived">Arquivada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Tipo de pedido" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {sourceOptions.map((s) => (
                  <SelectItem key={s} value={s}>{sourceLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            {(search || statusFilter !== 'all' || sourceFilter !== 'all' || dateFrom || dateTo) && (
              <Button variant="ghost" onClick={() => {
                setSearch(''); setStatusFilter('all'); setSourceFilter('all'); setDateFrom(''); setDateTo('');
              }}>Limpar</Button>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">A carregar mensagens...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Estado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow
                    key={m.id}
                    className={m.status === 'unread' ? 'font-medium bg-primary/5' : ''}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={m.status}
                        onValueChange={(v) => changeStatus(m.id, v as MessageStatus)}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <StatusBadge status={m.status} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unread">Nova</SelectItem>
                          <SelectItem value="read">Lida</SelectItem>
                          <SelectItem value="answered">Respondida</SelectItem>
                          <SelectItem value="archived">Arquivada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => openMessage(m)}>
                      <Badge variant="outline">{sourceLabel(m.source)}</Badge>
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => openMessage(m)}>{m.name}</TableCell>
                    <TableCell className="cursor-pointer" onClick={() => openMessage(m)}>
                      <div className="text-sm">{m.email}</div>
                      {m.phone && <div className="text-xs text-muted-foreground">{m.phone}</div>}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate cursor-pointer" onClick={() => openMessage(m)}>
                      {m.message || '—'}
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => openMessage(m)}>{m.vehicle_title || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap cursor-pointer" onClick={() => openMessage(m)}>
                      {new Date(m.created_at).toLocaleString('pt-PT')}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => changeStatus(m.id, 'archived')}
                        title="Arquivar"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="text-destructive"
                        onClick={() => { if (confirm('Eliminar esta mensagem?')) deleteMutation.mutate(m.id); }}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Nenhuma mensagem encontrada.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {sourceLabel(selected.source)} — {selected.name}
                </DialogTitle>
                <DialogDescription>
                  {new Date(selected.created_at).toLocaleString('pt-PT')} · <StatusBadge status={selected.status} />
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selected.email}`} className="hover:underline break-all">{selected.email}</a>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selected.phone}`} className="hover:underline">{selected.phone}</a>
                    </div>
                  )}
                </div>
                {selected.vehicle_title && (
                  <div className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{selected.vehicle_title}</div>
                    {selected.vehicle_url && (
                      <a
                        href={selected.vehicle_url}
                        target="_blank" rel="noopener noreferrer"
                        className="text-primary text-xs inline-flex items-center gap-1 mt-1"
                      >
                        Abrir anúncio <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
                {selected.message && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                    <div className="rounded-md bg-muted p-4 whitespace-pre-line text-sm">{selected.message}</div>
                  </div>
                )}
                {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Detalhes adicionais</p>
                    <div className="rounded-md border divide-y">
                      {Object.entries(selected.metadata).map(([k, v]) => (
                        <div key={k} className="grid grid-cols-3 gap-2 p-2 text-sm">
                          <div className="text-muted-foreground">{humanizeKey(k)}</div>
                          <div className="col-span-2 break-words whitespace-pre-line">{renderMetaValue(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(selected.interest || selected.company) && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selected.interest && <div><span className="text-muted-foreground">Interesse:</span> {selected.interest}</div>}
                    {selected.company && <div><span className="text-muted-foreground">Empresa:</span> {selected.company}</div>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => changeStatus(selected.id, 'unread')}>
                    <MailOpen className="h-4 w-4 mr-2" /> Nova
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => changeStatus(selected.id, 'read')}>
                    Lida
                  </Button>
                  <Button size="sm" onClick={() => changeStatus(selected.id, 'answered')}>
                    <CheckCheck className="h-4 w-4 mr-2" /> Respondida
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => changeStatus(selected.id, 'archived')}>
                    <Archive className="h-4 w-4 mr-2" /> Arquivar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesManagement;
