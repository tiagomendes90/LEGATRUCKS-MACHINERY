import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Archive, ArchiveRestore, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useLists,
  useListMemberCounts,
  useSaveList,
  useDeleteList,
  useArchiveList,
  useListUsage,
  useSetListMembership,
  useSubscribers,
} from "@/hooks/useNewsletter";

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

export default function NewsletterListsPanel() {
  const lists = useLists();
  const counts = useListMemberCounts();
  const subscribers = useSubscribers();
  const saveList = useSaveList();
  const deleteList = useDeleteList();
  const archiveList = useArchiveList();
  const usage = useListUsage();
  const membership = useSetListMembership();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const activeSubscribers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (subscribers.data ?? [])
      .filter((s) => s.status === "active")
      .filter((s) => (q ? s.email.toLowerCase().includes(q) : true))
      .slice(0, 300);
  }, [subscribers.data, search]);

  const create = async () => {
    if (!name.trim()) return;
    try {
      await saveList.mutateAsync({
        id: editingId ?? undefined,
        name: name.trim(),
        key: slugify(name),
        description: description.trim() || null,
      } as any);
      setName("");
      setDescription("");
      setEditingId(null);
      toast({ title: editingId ? "Lista atualizada" : "Lista criada" });
    } catch (err: any) {
      toast({ title: "Falha ao guardar lista", description: String(err?.message ?? err), variant: "destructive" });
    }
  };

  const removeList = async (id: string) => {
    const used = usage.data?.[id] ?? 0;
    const members = counts.data?.[id]?.total ?? 0;
    if (used > 0) {
      toast({
        title: "Lista em uso",
        description: `Está associada a ${used} campanha(s). Arquiva-a em vez de eliminar.`,
        variant: "destructive",
      });
      return;
    }
    if (members > 0) {
      toast({
        title: "Lista com membros",
        description: `Remove primeiro os ${members} subscritores associados.`,
        variant: "destructive",
      });
      return;
    }
    try {
      await deleteList.mutateAsync(id);
      toast({ title: "Lista eliminada" });
    } catch (err: any) {
      toast({ title: "Falha ao eliminar", description: String(err?.message ?? err), variant: "destructive" });
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Listas</CardTitle>
          <CardDescription>Segmenta subscritores por interesse, região ou tipo de equipamento.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Membros ativos</TableHead>
                <TableHead>Campanhas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(lists.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Ainda não existem listas.
                  </TableCell>
                </TableRow>
              ) : (
                (lists.data ?? []).map((l) => (
                  <TableRow key={l.id} className={selectedList === l.id ? "bg-accent/50" : ""}>
                    <TableCell className="font-medium">
                      {l.name}
                      {l.is_default && <Badge variant="secondary" className="ml-2">Padrão</Badge>}
                      {l.archived_at && <Badge variant="outline" className="ml-2">Arquivada</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.key}</TableCell>
                    <TableCell>{counts.data?.[l.id]?.active ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{usage.data?.[l.id] ?? 0}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedList(l.id)}>Membros</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Editar"
                        onClick={() => {
                          setEditingId(l.id);
                          setName(l.name);
                          setDescription(l.description ?? "");
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
                        {l.archived_at
                          ? <ArchiveRestore className="h-3.5 w-3.5" />
                          : <Archive className="h-3.5 w-3.5" />}
                      </Button>
                      {!l.is_default && (
                        <Button size="sm" variant="ghost" title="Eliminar" onClick={() => removeList(l.id)}>
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

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">{editingId ? "Editar lista" : "Nova lista"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Clientes Tratores" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={create} disabled={saveList.isPending || !name.trim()} className="flex-1">
                <Plus className="h-4 w-4 mr-1" /> {editingId ? "Guardar" : "Criar lista"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={() => { setEditingId(null); setName(""); setDescription(""); }}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedList && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Membros</CardTitle>
              <CardDescription>
                Seleciona subscritores ativos e adiciona ou remove da lista.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Pesquisar email…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <ScrollArea className="h-56 border rounded">
                <div className="p-2 space-y-1">
                  {activeSubscribers.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm px-1 py-1 rounded hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={picked.includes(s.id)}
                        onChange={() =>
                          setPicked((prev) =>
                            prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                          )
                        }
                      />
                      <span className="font-mono text-xs truncate">{s.email}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={picked.length === 0 || membership.isPending}
                  onClick={async () => {
                    await membership.mutateAsync({ listId: selectedList, subscriberIds: picked, action: "add" });
                    setPicked([]);
                    toast({ title: "Subscritores adicionados" });
                  }}
                >
                  Adicionar ({picked.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={picked.length === 0 || membership.isPending}
                  onClick={async () => {
                    await membership.mutateAsync({ listId: selectedList, subscriberIds: picked, action: "remove" });
                    setPicked([]);
                    toast({ title: "Subscritores removidos" });
                  }}
                >
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}