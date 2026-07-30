import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useTemplates,
  useSaveTemplate,
  useDeleteTemplate,
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
  intro: "",
  outro: "",
};

export default function NewsletterTemplatesPanel() {
  const templates = useTemplates();
  const saveTemplate = useSaveTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [form, setForm] = useState(EMPTY);

  const edit = (t: NewsletterTemplate) =>
    setForm({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      subject_template: t.subject_template ?? "",
      preheader_template: t.preheader_template ?? "",
      intro: t.content_json?.intro ?? "",
      outro: t.content_json?.outro ?? "",
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
        content_json: { intro: form.intro, outro: form.outro },
      } as any);
      setForm(EMPTY);
      toast({ title: "Template guardado" });
    } catch (err: any) {
      toast({ title: "Falha ao guardar", description: String(err?.message ?? err), variant: "destructive" });
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
                <TableHead>Layout</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(templates.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
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
                    <TableCell className="text-xs text-muted-foreground">{t.template_key}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => edit(t)}>Editar</Button>
                      {!t.is_default && (
                        <Button size="sm" variant="ghost" onClick={() => deleteTemplate.mutate(t.id)}>
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
            <Label>Introdução</Label>
            <Textarea rows={3} value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} />
          </div>
          <div>
            <Label>Fecho</Label>
            <Textarea rows={3} value={form.outro} onChange={(e) => setForm({ ...form, outro: e.target.value })} />
          </div>
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