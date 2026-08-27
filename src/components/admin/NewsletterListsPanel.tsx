import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRightLeft,
  FlaskConical,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useLists,
  useListMemberCounts,
  useSaveList,
  useDeleteList,
  useArchiveList,
  useListUsage,
  useListContacts,
  useAddContactToList,
  useRemoveContactFromList,
  useMoveContacts,
  useSetSubscriberStatus,
  useUpdateSubscriber,
  useImportContacts,
  type NewsletterList,
} from "@/hooks/useNewsletter";
import { usePersistentState } from "@/hooks/usePersistentState";

const PAGE_SIZE = 50;

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const split = (line: string) =>
    line.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ""));
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const idx = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const iEmail = idx("email", "e-mail", "email address");
  const hasHeader = iEmail >= 0;
  const iName = idx("nome", "name", "first_name", "vendedor");
  const iCompany = idx("empresa", "company");
  const iCountry = idx("pais", "país", "country");
  const iPhone = idx("telefone", "phone", "contato", "contacto");
  const body = hasHeader ? lines.slice(1) : lines;
  return body
    .map((line) => {
      const c = split(line);
      const email = hasHeader ? c[iEmail] : c[0];
      return {
        email: email ?? "",
        first_name: iName >= 0 ? c[iName] : null,
        company: iCompany >= 0 ? c[iCompany] : null,
        country: iCountry >= 0 ? c[iCountry] : null,
        phone: iPhone >= 0 ? c[iPhone] : null,
      };
    })
    .filter((r) => r.email);
}

export default function NewsletterListsPanel() {
  const lists = useLists();
  const counts = useListMemberCounts();
  const usage = useListUsage();
  const saveList = useSaveList();
  const deleteList = useDeleteList();
  const archiveList = useArchiveList();

  const [openListId, setOpenListId] = usePersistentState<string | null>("newsletter.lists.open", null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NewsletterList | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const openList = (lists.data ?? []).find((l) => l.id === openListId) ?? null;

  const submitList = async () => {
    if (!name.trim()) return;
    try {
      await saveList.mutateAsync({
        id: editing?.id,
        name: name.trim(),
        key: editing?.key ?? slugify(name),
        description: description.trim() || null,
      } as any);
      setFormOpen(false);
      setEditing(null);
      setName("");
      setDescription("");
      toast({ title: editing ? "Lista atualizada" : "Lista criada" });
    } catch (err: any) {
      toast({ title: "Falha ao guardar lista", description: String(err?.message ?? err), variant: "destructive" });
    }
  };

  const removeList = async (l: NewsletterList) => {
    const used = usage.data?.[l.id] ?? 0;
    const members = counts.data?.[l.id]?.total ?? 0;
    if (used > 0) {
      toast({ title: "Lista em uso", description: `Associada a ${used} campanha(s). Arquiva-a.`, variant: "destructive" });
      return;
    }
    if (members > 0) {
      toast({ title: "Lista com contactos", description: `Remove primeiro os ${members} contactos.`, variant: "destructive" });
      return;
    }
    await deleteList.mutateAsync(l.id);
    toast({ title: "Lista eliminada" });
  };

  if (openList) {
    return (
      <ListDetail
        list={openList}
        lists={(lists.data ?? []).filter((l) => l.id !== openList.id)}
        onBack={() => setOpenListId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Listas de destinatários
          </h3>
          <p className="text-sm text-muted-foreground">
            Um contacto pode pertencer a várias listas — nunca é duplicado.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setName("");
            setDescription("");
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Nova lista
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(lists.data ?? []).map((l) => {
          const c = counts.data?.[l.id];
          const isTest = l.key === "teste";
          return (
            <Card key={l.id} className={isTest ? "border-amber-400/70" : undefined}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {isTest && <FlaskConical className="h-4 w-4 text-amber-600" />}
                  {l.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {l.description ?? "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold">{(c?.total ?? 0).toLocaleString("pt-PT")}</p>
                  <p className="text-xs text-muted-foreground">
                    {(c?.active ?? 0).toLocaleString("pt-PT")} ativos · {usage.data?.[l.id] ?? 0} campanha(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {l.is_default && <Badge variant="secondary">Padrão</Badge>}
                  {l.archived_at && <Badge variant="outline">Arquivada</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="flex-1" onClick={() => setOpenListId(l.id)}>
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Editar"
                    onClick={() => {
                      setEditing(l);
                      setName(l.name);
                      setDescription(l.description ?? "");
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title={l.archived_at ? "Restaurar" : "Arquivar"}
                    onClick={() => archiveList.mutate({ id: l.id, archived: !l.archived_at })}
                  >
                    {l.archived_at ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  </Button>
                  {!l.is_default && (
                    <Button size="sm" variant="ghost" title="Eliminar" onClick={() => removeList(l)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lista" : "Nova lista"}</DialogTitle>
            <DialogDescription>
              As novas listas ficam imediatamente disponíveis para campanhas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Clientes VIP" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={submitList} disabled={!name.trim() || saveList.isPending}>
              {editing ? "Guardar" : "Criar lista"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListDetail({
  list,
  lists,
  onBack,
}: {
  list: NewsletterList;
  lists: NewsletterList[];
  onBack: () => void;
}) {
  const contacts = useListContacts(list.id);
  const addContact = useAddContactToList();
  const removeContact = useRemoveContactFromList();
  const moveContacts = useMoveContacts();
  const setStatus = useSetSubscriberStatus();
  const updateSubscriber = useUpdateSubscriber();
  const importContacts = useImportContacts();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string>("");
  const [keepOriginal, setKeepOriginal] = useState(false);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    company: "",
    country: "",
    phone: "",
    preferred_language: "en",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = contacts.data ?? [];
    if (!q) return all;
    return all.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        (c.first_name ?? "").toLowerCase().includes(q) ||
        JSON.stringify(c.metadata ?? {}).toLowerCase().includes(q),
    );
  }, [contacts.data, search]);

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const submitContact = async () => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    if ((contacts.data ?? []).some((c) => c.email === email)) {
      toast({ title: "Contacto já existe nesta lista", variant: "destructive" });
      return;
    }
    try {
      const res = await addContact.mutateAsync({ listId: list.id, contact: { ...form, email } });
      setAddOpen(false);
      setForm({ email: "", first_name: "", company: "", country: "", phone: "", preferred_language: "en" });
      toast({
        title: res.reused ? "Contacto existente associado" : "Contacto adicionado",
        description: email,
      });
    } catch (err: any) {
      toast({ title: "Falha ao adicionar", description: String(err?.message ?? err), variant: "destructive" });
    }
  };

  const onImportFile = async (file: File) => {
    const rows = parseCsv(await file.text());
    if (rows.length === 0) {
      toast({ title: "Ficheiro sem contactos válidos", variant: "destructive" });
      return;
    }
    try {
      const res = await importContacts.mutateAsync({ listId: list.id, rows });
      toast({ title: "Importação concluída", description: `${res.linked} contactos na lista.` });
    } catch (err: any) {
      toast({ title: "Falha na importação", description: String(err?.message ?? err), variant: "destructive" });
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Listas
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{list.name}</h3>
            <p className="text-xs text-muted-foreground">
              {(contacts.data ?? []).length.toLocaleString("pt-PT")} contactos ·{" "}
              {(contacts.data ?? []).filter((c) => c.status === "active").length.toLocaleString("pt-PT")} ativos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importContacts.isPending}>
            <Upload className="h-4 w-4 mr-1" /> Importar CSV
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Adicionar contacto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-3">
          <Input
            placeholder="Pesquisar email, nome ou empresa…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="max-w-sm"
          />
          {selected.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setMoveOpen(true)}>
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Mover ({selected.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await removeContact.mutateAsync({ listId: list.id, subscriberIds: selected });
                  setSelected([]);
                  toast({ title: "Contactos removidos da lista" });
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> Remover da lista
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Idioma</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">A carregar…</TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Sem contactos nesta lista.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.email}</TableCell>
                    <TableCell className="text-sm">{c.first_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.metadata?.company ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.metadata?.country ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.metadata?.phone ?? "—"}</TableCell>
                    <TableCell>
                      <select
                        className="h-8 rounded border border-input bg-background px-1 text-xs"
                        value={c.preferred_language ?? "en"}
                        onChange={(e) =>
                          updateSubscriber.mutate({ id: c.id, patch: { preferred_language: e.target.value } })
                        }
                      >
                        <option value="en">EN</option>
                        <option value="pt">PT</option>
                        <option value="fr">FR</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "secondary" : "outline"}>
                        {c.status === "active" ? "Ativo" : c.status === "unsubscribed" ? "Cancelado" : c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setStatus.mutate({
                            id: c.id,
                            status: c.status === "active" ? "unsubscribed" : "active",
                          })
                        }
                      >
                        {c.status === "active" ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Remover desta lista"
                        onClick={async () => {
                          await removeContact.mutateAsync({ listId: list.id, subscriberIds: [c.id] });
                          toast({ title: "Removido da lista", description: c.email });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length.toLocaleString("pt-PT")} resultado(s) · página {page + 1} de {pages}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
            Seguinte
          </Button>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar contacto a {list.name}</DialogTitle>
            <DialogDescription>
              Se o email já existir na base de dados, é reutilizado o contacto — sem duplicados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Email *</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <Label>País</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Idioma preferido</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.preferred_language}
                onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={submitContact} disabled={addContact.isPending}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover {selected.length} contacto(s)</DialogTitle>
            <DialogDescription>O contacto não é duplicado — apenas muda de lista.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Lista de destino</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={moveTarget}
                onChange={(e) => setMoveTarget(e.target.value)}
              >
                <option value="">Escolher lista…</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)} />
              Manter também em {list.name} (copiar em vez de mover)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>Cancelar</Button>
            <Button
              disabled={!moveTarget || moveContacts.isPending}
              onClick={async () => {
                await moveContacts.mutateAsync({
                  fromListId: list.id,
                  toListId: moveTarget,
                  subscriberIds: selected,
                  keepOriginal,
                });
                setMoveOpen(false);
                setSelected([]);
                toast({ title: keepOriginal ? "Contactos copiados" : "Contactos movidos" });
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
