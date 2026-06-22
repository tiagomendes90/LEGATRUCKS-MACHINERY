import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LEGA_BLUE = "#0B2545";
const LEGA_BLUE_DEEP = "#081B33";
const LEGA_ORANGE = "#F39200";
const LEGA_LOGO = "/lovable-uploads/9a1d192d-e9d6-4064-944c-c583427ab323.png";

type Format = {
  id: "instagram" | "facebook" | "story";
  label: string;
  width: number;
  height: number;
};

const FORMATS: Format[] = [
  { id: "instagram", label: "Instagram (1080×1080)", width: 1080, height: 1080 },
  { id: "facebook", label: "Facebook (1200×1200)", width: 1200, height: 1200 },
  { id: "story", label: "Story / Reel (1080×1920)", width: 1080, height: 1920 },
];

interface Props {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (price?: number | null) => {
  if (!price || Number(price) <= 0) return "Sob consulta";
  return "€ " + Number(price).toLocaleString("pt-PT");
};

const collectFeatures = (vehicle: any): string[] => {
  const out: string[] = [];
  const cond = (vehicle?.condition || "").toLowerCase();
  if (cond === "new") out.push("Novo");
  else if (cond === "restored") out.push("Restaurado");
  else if (cond === "used") out.push("Excelente estado");
  out.push("Entrega imediata");
  out.push("Exportação para toda a Europa");
  out.push("Documentação em ordem");
  out.push("Inspeção técnica disponível");
  out.push("Financiamento disponível");
  return out.slice(0, 6);
};

export const SocialAdGenerator = ({ vehicle, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const refs = {
    instagram: useRef<HTMLDivElement>(null),
    facebook: useRef<HTMLDivElement>(null),
    story: useRef<HTMLDivElement>(null),
  };

  const data = useMemo(() => {
    const images: string[] = (vehicle?.images || [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((i: any) => i.image_url)
      .filter(Boolean);
    const main = vehicle?.main_image_url || images[0] || "";
    const secondary = images.filter((u) => u !== main).slice(0, 3);
    const brand = vehicle?.brand?.name || "";
    const title: string = vehicle?.title || "";
    const model = vehicle?.model || title.replace(new RegExp(`^${brand}\\s*`, "i"), "").trim();
    const year = vehicle?.year ?? vehicle?.registration_year ?? null;
    const price = vehicle?.price ?? vehicle?.price_eur ?? null;
    const km = vehicle?.mileage_km ?? null;
    const hours = vehicle?.operating_hours ?? null;
    const power = vehicle?.power_hp ?? null;
    const category = vehicle?.subcategory?.category?.name || "";
    return { images, main, secondary, brand, title, model, year, price, km, hours, power, category };
  }, [vehicle]);

  const features = useMemo(() => collectFeatures(vehicle), [vehicle]);

  const handleDownload = async (fmt: Format) => {
    const el = refs[fmt.id].current;
    if (!el) return;
    setGenerating(fmt.id);
    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: LEGA_BLUE,
        scale: 1,
        width: fmt.width,
        height: fmt.height,
        windowWidth: fmt.width,
        windowHeight: fmt.height,
      });
      const link = document.createElement("a");
      const safeTitle = (data.title || "lega-anuncio").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      link.download = `lega-${fmt.id}-${safeTitle}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Imagem gerada", description: `${fmt.label} descarregada com sucesso.` });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro ao gerar imagem",
        description: e?.message || "Verifique a imagem principal do veículo (CORS).",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadAll = async () => {
    for (const f of FORMATS) {
      // eslint-disable-next-line no-await-in-loop
      await handleDownload(f);
    }
  };

  /** Single template, parameterized by overall dimensions. */
  const Template = ({ w, h }: { w: number; h: number }) => {
    const isStory = h > w;
    const pad = Math.round(w * 0.05);
    const headerH = Math.round(h * (isStory ? 0.08 : 0.1));
    const imgH = Math.round(h * (isStory ? 0.42 : 0.42));
    const footerH = Math.round(h * (isStory ? 0.08 : 0.09));

    return (
      <div
        style={{
          width: w,
          height: h,
          background: `linear-gradient(160deg, ${LEGA_BLUE} 0%, ${LEGA_BLUE_DEEP} 100%)`,
          color: "#fff",
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent corner */}
        <div
          style={{
            position: "absolute",
            top: -w * 0.15,
            right: -w * 0.15,
            width: w * 0.55,
            height: w * 0.55,
            background: LEGA_ORANGE,
            transform: "rotate(45deg)",
            opacity: 0.12,
          }}
        />

        {/* Header */}
        <div
          style={{
            height: headerH,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${pad}px`,
            zIndex: 2,
          }}
        >
          <img
            src={LEGA_LOGO}
            alt="LEGA"
            crossOrigin="anonymous"
            style={{ height: headerH * 0.6, objectFit: "contain" }}
          />
          <div
            style={{
              background: LEGA_ORANGE,
              color: "#fff",
              fontWeight: 900,
              letterSpacing: 4,
              fontSize: headerH * 0.32,
              padding: `${headerH * 0.18}px ${headerH * 0.55}px`,
              borderRadius: 4,
            }}
          >
            FOR SALE
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: `${pad * 0.2}px ${pad}px`, zIndex: 2 }}>
          {data.category && (
            <div
              style={{
                fontSize: w * 0.022,
                letterSpacing: 6,
                color: LEGA_ORANGE,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: w * 0.01,
              }}
            >
              {data.category}
            </div>
          )}
          <div
            style={{
              fontSize: w * (isStory ? 0.07 : 0.062),
              fontWeight: 900,
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: -1,
            }}
          >
            {(data.brand + " " + data.model).trim() || data.title}
          </div>
        </div>

        {/* Main image */}
        <div
          style={{
            margin: `${pad * 0.4}px ${pad}px 0`,
            height: imgH,
            background: "#000",
            borderRadius: 12,
            overflow: "hidden",
            position: "relative",
            zIndex: 2,
            border: `3px solid ${LEGA_ORANGE}`,
          }}
        >
          {data.main ? (
            <img
              src={data.main}
              alt={data.title}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
              Sem imagem
            </div>
          )}
        </div>

        {/* Specs + Features row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: pad * 0.6,
            padding: `${pad * 0.6}px ${pad}px 0`,
            zIndex: 2,
            flex: 1,
          }}
        >
          {/* Specs */}
          <div style={{ display: "flex", flexDirection: "column", gap: w * 0.012 }}>
            {[
              data.brand && ["MARCA", data.brand],
              data.model && ["MODELO", data.model],
              data.year && ["ANO", String(data.year)],
              data.km && ["KM", Number(data.km).toLocaleString("pt-PT")],
              data.hours && ["HORAS", Number(data.hours).toLocaleString("pt-PT") + " h"],
              data.power && ["POTÊNCIA", `${data.power} HP`],
            ]
              .filter(Boolean)
              .slice(0, 6)
              .map((row: any) => (
                <div key={row[0]} style={{ borderLeft: `3px solid ${LEGA_ORANGE}`, paddingLeft: w * 0.015 }}>
                  <div style={{ fontSize: w * 0.018, color: "#9DB4D1", letterSpacing: 2, fontWeight: 700 }}>{row[0]}</div>
                  <div style={{ fontSize: w * 0.028, fontWeight: 700, lineHeight: 1.1 }}>{row[1]}</div>
                </div>
              ))}
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: w * 0.012 }}>
            {features.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: w * 0.012, fontSize: w * 0.024, fontWeight: 600 }}>
                <span style={{ color: LEGA_ORANGE, fontWeight: 900, fontSize: w * 0.028 }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnails + Price */}
        <div style={{ padding: `${pad * 0.5}px ${pad}px`, zIndex: 2 }}>
          {data.secondary.length > 0 && (
            <div style={{ display: "flex", gap: pad * 0.3, marginBottom: pad * 0.4 }}>
              {data.secondary.map((url, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: w * 0.13,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.15)",
                    background: "#000",
                  }}
                >
                  <img src={url} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="" />
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              background: LEGA_ORANGE,
              borderRadius: 10,
              padding: `${w * 0.025}px ${pad}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: w * 0.022, fontWeight: 800, letterSpacing: 4, color: "#fff" }}>PREÇO</div>
            <div style={{ fontSize: w * (isStory ? 0.08 : 0.07), fontWeight: 900, color: "#fff", lineHeight: 1 }}>
              {formatPrice(data.price)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            height: footerH,
            background: LEGA_BLUE_DEEP,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${pad}px`,
            borderTop: `3px solid ${LEGA_ORANGE}`,
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: footerH * 0.28, fontWeight: 800 }}>WhatsApp · +351 912 406 089</div>
            <div style={{ fontSize: footerH * 0.22, color: "#9DB4D1", letterSpacing: 2 }}>www.lega.pt</div>
          </div>
          <img src={LEGA_LOGO} alt="LEGA" crossOrigin="anonymous" style={{ height: footerH * 0.55, objectFit: "contain" }} />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📢 Gerar Anúncio para Redes Sociais</DialogTitle>
          <DialogDescription>
            Pré-visualização do anúncio gerado automaticamente a partir dos dados do veículo. Descarregue nos formatos
            otimizados para cada plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            {FORMATS.map((f) => (
              <Button key={f.id} onClick={() => handleDownload(f)} disabled={!!generating}>
                {generating === f.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {f.label}
              </Button>
            ))}
            <Button variant="outline" onClick={handleDownloadAll} disabled={!!generating}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Descarregar todos
            </Button>
          </div>

          {/* Previews — visually scaled down; original size used for rendering */}
          <div className="grid md:grid-cols-3 gap-6">
            {FORMATS.map((f) => {
              const previewW = f.id === "story" ? 220 : 280;
              const scale = previewW / f.width;
              return (
                <div key={f.id} className="space-y-2">
                  <p className="text-sm font-medium text-center">{f.label}</p>
                  <div
                    className="mx-auto border rounded shadow-sm overflow-hidden bg-muted"
                    style={{ width: previewW, height: f.height * scale }}
                  >
                    <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: f.width, height: f.height }}>
                      <div ref={refs[f.id]}>
                        <Template w={f.width} h={f.height} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Dica: se a imagem principal do veículo bloquear a geração por CORS, abra-a no navegador para confirmar que
            está acessível, ou faça novo upload através do painel.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialAdGenerator;