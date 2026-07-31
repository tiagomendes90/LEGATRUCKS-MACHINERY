import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useTemplates,
  useSaveTemplate,
  useDeleteTemplate,
  useSetTemplateDefault,
  useToggleTemplateActive,
  useTemplateUsage,
  type NewsletterTemplate,
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

const EMPTY = {
  id: null as string | null,
  name: "",
  description: "",
  subject_template: "",
  preheader_template: "",
  header: "",
  footer: "",
  intro: "",
  outro: "",
  is_active: true,
};

export default function NewsletterTemplatesPanel() {
  const templates = useTemplates();
  const saveTemplate = useSaveTemplate();
  const deleteTemplate = useDeleteTemplate();
  const setDefault = useSetTemplateDefault();
  const toggleActive = useToggleTemplateActive();
  const usage = useTemplateUsage();
  const [form, setForm] = useState(EMPTY);

  const edit = (t: NewsletterTemplate) =>
    setForm({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      subject_template: t.subject_template ?? "",
      preheader_template: t.preheader_template ?? "",
      header: t.content_json?.header ?? "",
      footer: t.content_json?.footer ?? "",
      intro: t.content_json?.intro ?? "",
      outro: t.content_json?.outro ?? "",
      is_active: t.is_active,
    });

  const submit = async () => {
    if (!form.name.trim()) return;
    try {
      await saveTemplate.mutateAsync({
        id: form.id ?? undefined,
        name: form.name.trim(),
        key: slugify(form.name),
        description: form.description.trim() || null,
        subject_template: form.subject_template.trim() || null,
        preheader_template: form.preheader_template.trim() || null,
        content_json: {
          header: form.header,
          footer: form.footer,
          intro: form.intro,
          outro: form.outro,
        },
        is_active: form.is_active,
      } as any);
      setForm(EMPTY);
      toast({ title: "Template guardado" });
    } catch (err: any) {
      toast({ title: "Falha ao guardar", description: String(err?.message ?? err), variant: "destructive" });
    }
  };

  const remove = async (t: NewsletterTemplate) => {
    const used = usage.data?.[t.id] ?? 0;
    if (used > 0) {
      toast({
        title: "Template em uso",
        description: `Está associado a ${used} campanha(s). Desativa-o em vez de eliminar.`,
        variant: "destructive",
      });
      return;
    }
    try {
      await deleteTemplate.mutateAsync(t.id);
      toast({ title: "Template eliminado" });
    } catch (err: any) {
      toast({ title: "Falha ao eliminar", description: String(err?.message ?? err), variant: "destructive" });
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Templates</CardTitle>
          <CardDescription>Blocos de conteúdo reutilizáveis aplicados às campanhas.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Campanhas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(templates.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Ainda não existem templates.
                  </TableCell>
                </TableRow>
              ) : (
                (templates.data ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.name}
                      {t.is_default && <Badge variant="secondary" className="ml-2">Padrão</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.key}</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "secondary" : "outline"}>
                        {t.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{usage.data?.[t.id] ?? 0}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => edit(t)}>Editar</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Definir como padrão"
                        disabled={t.is_default}
                        onClick={() => setDefault.mutate(t.id)}
                      >
                        <Star className={`h-3.5 w-3.5 ${t.is_default ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive.mutate({ id: t.id, active: !t.is_active })}
                      >
                        {t.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      {!t.is_default && (
                        <Button size="sm" variant="ghost" title="Eliminar" onClick={() => remove(t)}>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{form.id ? "Editar template" : "Novo template"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Assunto sugerido</Label>
            <Input value={form.subject_template} onChange={(e) => setForm({ ...form, subject_template: e.target.value })} />
          </div>
          <div>
            <Label>Preheader sugerido</Label>
            <Input value={form.preheader_template} onChange={(e) => setForm({ ...form, preheader_template: e.target.value })} />
          </div>
          <div>
            <Label>Cabeçalho</Label>
            <Input
              value={form.header}
              onChange={(e) => setForm({ ...form, header: e.target.value })}
              placeholder="Camiões · Máquinas · Equipamento"
            />
          </div>
          <div>
            <Label>Introdução</Label>
            <Textarea rows={3} value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} />
          </div>
          <div>
            <Label>Fecho</Label>
            <Textarea rows={3} value={form.outro} onChange={(e) => setForm({ ...form, outro: e.target.value })} />
          </div>
          <div>
            <Label>Rodapé</Label>
            <Textarea rows={2} value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Template ativo
          </label>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={saveTemplate.isPending || !form.name.trim()} className="flex-1">
              <Plus className="h-4 w-4 mr-1" /> {form.id ? "Guardar" : "Criar template"}
            </Button>
            {form.id && (
              <Button variant="outline" onClick={() => setForm(EMPTY)}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}