import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Trash2, Mail, MessageSquare, Phone, ExternalLink, CheckCheck, MailOpen } from 'lucide-react';
import {
  ContactMessage,
  useContactMessages,
  useDeleteContactMessage,
  useUpdateContactMessage,
} from '@/hooks/useContactMessages';

const statusLabels: Record<string, string> = {
  unread: 'Não lida',
  read: 'Lida',
  answered: 'Respondida',
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    unread: 'bg-primary text-primary-foreground',
    read: 'bg-muted text-muted-foreground',
    answered: 'bg-accent text-accent-foreground',
  };
  return <Badge className={map[status] || ''}>{statusLabels[status] || status}</Badge>;
};

const sourceBadge = (source: string) => (
  <Badge variant="outline">{source === 'vehicle' ? 'Veículo' : 'Contacto Geral'}</Badge>
);

const MessagesManagement = () => {
  const { data: messages = [], isLoading } = useContactMessages();
  const updateMutation = useUpdateContactMessage();
  const deleteMutation = useDeleteContactMessage();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const vehicleOptions = useMemo(() => {
    const map = new Map<string, string>();
    messages.forEach((m) => {
      if (m.vehicle_id && m.vehicle_title) map.set(m.vehicle_id, m.vehicle_title);
    });
    return Array.from(map.entries());
  }, [messages]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const term = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && m.source !== sourceFilter) return false;
      if (vehicleFilter !== 'all' && m.vehicle_id !== vehicleFilter) return false;
      if (dateFilter !== 'all') {
        const age = now - new Date(m.created_at).getTime();
        if (dateFilter === 'today' && age > day) return false;
        if (dateFilter === 'week' && age > 7 * day) return false;
        if (dateFilter === 'month' && age > 30 * day) return false;
      }
      if (term) {
        const hay = `${m.name} ${m.email} ${m.phone || ''} ${m.message} ${m.vehicle_title || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [messages, search, statusFilter, sourceFilter, vehicleFilter, dateFilter]);

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  const openMessage = (m: ContactMessage) => {
    setSelected(m);
    if (m.status === 'unread') {
      updateMutation.mutate({ id: m.id, updates: { status: 'read' } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 text-center">
          <p className="text-2xl font-bold">{messages.length}</p>
          <p className="text-sm text-muted-foreground">Total Mensagens</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-2xl font-bold text-primary">{unreadCount}</p>
          <p className="text-sm text-muted-foreground">Não lidas</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-2xl font-bold">{messages.filter(m => m.source === 'vehicle').length}</p>
          <p className="text-sm text-muted-foreground">De Veículos</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-2xl font-bold">{messages.filter(m => m.status === 'answered').length}</p>
          <p className="text-sm text-muted-foreground">Respondidas</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensagens recebidas</CardTitle>
          <CardDescription>Centro único de contactos do website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar nome, email, telefone, mensagem..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="answered">Respondidas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Origem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="vehicle">Veículo</SelectItem>
                <SelectItem value="general">Contacto Geral</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Veículo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os veículos</SelectItem>
                {vehicleOptions.map(([id, title]) => (
                  <SelectItem key={id} value={id}>{title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Data" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer data</SelectItem>
                <SelectItem value="today">Últimas 24h</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">A carregar mensagens...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Origem</TableHead>
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
                    className={m.status === 'unread' ? 'font-medium bg-primary/5 cursor-pointer' : 'cursor-pointer'}
                    onClick={() => openMessage(m)}
                  >
                    <TableCell>{statusBadge(m.status)}</TableCell>
                    <TableCell>{sourceBadge(m.source)}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{m.email}</div>
                      {m.phone && <div className="text-xs text-muted-foreground">{m.phone}</div>}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">{m.message}</TableCell>
                    <TableCell>{m.vehicle_title || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString('pt-PT')}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Eliminar esta mensagem?')) deleteMutation.mutate(m.id);
                        }}
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
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Mensagem de {selected.name}
                </DialogTitle>
                <DialogDescription>
                  {new Date(selected.created_at).toLocaleString('pt-PT')} · {sourceBadge(selected.source)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selected.email}`} className="hover:underline">{selected.email}</a>
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
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs inline-flex items-center gap-1 mt-1"
                      >
                        Abrir anúncio <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
                <div className="rounded-md bg-muted p-4 whitespace-pre-line text-sm">
                  {selected.message}
                </div>
                <div className="flex flex-wrap gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateMutation.mutate({ id: selected.id, updates: { status: 'unread' } })
                    }
                  >
                    <MailOpen className="h-4 w-4 mr-2" /> Marcar como não lida
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateMutation.mutate({ id: selected.id, updates: { status: 'read' } })
                    }
                  >
                    Marcar como lida
                  </Button>
                  <Button
                    onClick={() =>
                      updateMutation.mutate({ id: selected.id, updates: { status: 'answered' } })
                    }
                  >
                    <CheckCheck className="h-4 w-4 mr-2" /> Marcar como respondida
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