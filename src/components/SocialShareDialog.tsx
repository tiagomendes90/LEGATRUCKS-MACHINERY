import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Facebook, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61573724754152";
const INSTAGRAM_URL = "https://www.instagram.com/lega_trucks_and_machinery/";
const SITE_URL = (typeof window !== "undefined" && window.location?.origin) || "https://lega.pt";

interface Props {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryHashtags = (categoryName?: string): string[] => {
  const name = (categoryName || "").toLowerCase();
  const base = ["#legatrucksandmachinery", "#usedequipment", "#europe"];
  if (name.includes("truck") || name.includes("camião") || name.includes("camiao")) base.unshift("#trucks");
  else if (name.includes("trator") || name.includes("tractor")) base.unshift("#tractors");
  else if (name.includes("trailer") || name.includes("reboque") || name.includes("semi")) base.unshift("#trailers");
  else if (name.includes("máquina") || name.includes("maquina") || name.includes("machinery") || name.includes("construção")) base.unshift("#machinery");
  else base.unshift("#machinery");
  return base;
};

export const SocialShareDialog = ({ vehicle, open, onOpenChange }: Props) => {
  const { toast } = useToast();

  const image =
    vehicle?.main_image_url ||
    vehicle?.images?.[0]?.image_url ||
    "";

  const brand = vehicle?.brand?.name || "";
  const title: string = vehicle?.title || "";
  const model = title.replace(new RegExp(`^${brand}\\s*`, "i"), "").trim() || title;
  const year = vehicle?.registration_year;
  const price = vehicle?.price_eur;
  const categoryName = vehicle?.subcategory?.category?.name;
  const description: string = vehicle?.description || "";
  const link = `${SITE_URL}/vehicle/${vehicle?.id}`;

  const hashtags = useMemo(() => categoryHashtags(categoryName), [categoryName]);

  const text = useMemo(() => {
    const lines: string[] = [];
    lines.push(`🚜 ${(brand + " " + model).toUpperCase().trim()}`);
    lines.push("");
    if (year) lines.push(`✔ Ano: ${year}`);
    lines.push("✔ Excelente estado");
    lines.push("✔ Disponível para entrega imediata");
    if (price && Number(price) > 0) {
      lines.push(`✔ Preço: €${Number(price).toLocaleString("pt-PT")}`);
    }
    lines.push("");
    lines.push("🌍 Exportação para toda a Europa");
    lines.push("");
    lines.push("📍 LEGA Trucks & Machinery");
    if (description) {
      const short = description.length > 220 ? description.slice(0, 217).trim() + "..." : description;
      lines.push("");
      lines.push(short);
    }
    lines.push("");
    lines.push("Mais informações:");
    lines.push(link);
    lines.push("");
    lines.push(hashtags.join(" "));
    return lines.join("\n");
  }, [brand, model, year, price, description, link, hashtags]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Texto copiado", description: "A publicação foi copiada para a área de transferência." });
    } catch {
      toast({ title: "Erro ao copiar", description: "Não foi possível copiar o texto.", variant: "destructive" });
    }
  };

  const handleCopyImage = async () => {
    if (!image) return;
    try {
      await navigator.clipboard.writeText(image);
      toast({ title: "URL da imagem copiado" });
    } catch {
      toast({ title: "Erro ao copiar URL", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📢 Publicar nas Redes Sociais</DialogTitle>
          <DialogDescription>
            Pré-visualize, copie o texto e abra a rede social para publicar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {image && (
            <div className="rounded-lg overflow-hidden border bg-muted">
              <img src={image} alt={title} className="w-full h-64 object-cover" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Texto da publicação</label>
            <Textarea value={text} readOnly rows={14} className="font-mono text-sm" />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {hashtags.map((h) => (
              <span key={h} className="px-2 py-1 bg-secondary rounded">{h}</span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button onClick={handleCopy} variant="default">
              <Copy className="h-4 w-4 mr-2" />📋 Copiar Texto
            </Button>
            {image && (
              <Button onClick={handleCopyImage} variant="outline">
                <Copy className="h-4 w-4 mr-2" />Copiar URL da imagem
              </Button>
            )}
            <Button asChild variant="outline">
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                <Facebook className="h-4 w-4 mr-2" />📘 Abrir Facebook
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4 mr-2" />📷 Abrir Instagram
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Nota: o Instagram não permite colar texto a partir do navegador no desktop. Recomendado usar a app móvel
            após copiar o texto.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialShareDialog;