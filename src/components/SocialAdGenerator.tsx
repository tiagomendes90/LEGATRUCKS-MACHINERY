import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WHATSAPP_DISPLAY } from "@/lib/whatsapp";

const LEGA_BLUE = "#0B2545";
const LEGA_BLUE_DARK = "#081B33";
const LEGA_ORANGE = "#F39200";
const LEGA_GRAY = "#F3F4F6";
const LEGA_LOGO = "/lovable-uploads/9a1d192d-e9d6-4064-944c-c583427ab323.png";
const SITE_URL = "lega.pt";

type FormatId = "instagram" | "facebook" | "story";

interface Format {
  id: FormatId;
  label: string;
  width: number;
  height: number;
}

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
  if (price === undefined || price === null || Number(price) <= 0) return "Sob consulta";
  return `€ ${Number(price).toLocaleString("pt-PT")}`;
};

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) return "";
  return Number(value).toLocaleString("pt-PT");
};

const collectHighlights = (vehicle: any): string[] => {
  const out: string[] = [];
  const cond = String(vehicle?.condition || "").toLowerCase();
  if (cond === "new") out.push("Novo");
  else if (cond === "restored") out.push("Restaurado");
  else if (cond === "used") out.push("Excelente estado");
  out.push("Entrega imediata");
  out.push("Exportação para toda a Europa");
  out.push("Documentação em ordem");
  out.push("Inspeção técnica disponível");
  return out.slice(0, 5);
};

export const SocialAdGenerator = ({ vehicle, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<FormatId | "all" | null>(null);
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
    const brand = vehicle?.brand?.name || "";
    const title: string = vehicle?.title || "";
    const model = vehicle?.model || title.replace(new RegExp(`^${brand}\\s*`, "i"), "").trim();
    const year = vehicle?.year ?? vehicle?.registration_year ?? null;
    const price = vehicle?.price ?? vehicle?.price_eur ?? null;
    const km = vehicle?.mileage_km ?? null;
    const hours = vehicle?.operating_hours ?? null;
    const power = vehicle?.power_hp ?? null;
    const category = vehicle?.subcategory?.category?.name || "";
    const condition = vehicle?.condition || "";
    return { main, brand, title, model, year, price, km, hours, power, category, condition };
  }, [vehicle]);

  const highlights = useMemo(() => collectHighlights(vehicle), [vehicle]);

  const handleDownload = async (fmt: Format, { silent = false }: { silent?: boolean } = {}) => {
    const el = refs[fmt.id].current;
    if (!el) return;
    if (!silent) setGenerating(fmt.id);
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
      const safeTitle = (data.title || "lega-anuncio")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.download = `lega-${fmt.id}-${safeTitle}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      if (!silent) {
        toast({ title: "Imagem gerada", description: `${fmt.label} descarregada com sucesso.` });
      }
    } catch (e: any) {
      console.error(e);
      if (!silent) {
        toast({
          title: "Erro ao gerar imagem",
          description: e?.message || "Verifique a imagem principal do veículo (CORS).",
          variant: "destructive",
        });
      }
      throw e;
    } finally {
      if (!silent) setGenerating(null);
    }
  };

  const handleDownloadAll = async () => {
    setGenerating("all");
    let errorCount = 0;
    try {
      for (const f of FORMATS) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await handleDownload(f, { silent: true });
        } catch {
          errorCount++;
        }
      }
      if (errorCount === 0) {
        toast({ title: "Imagens geradas", description: "Todos os formatos foram descarregados com sucesso." });
      } else {
        toast({
          title: "Aviso",
          description: `${errorCount} formato(s) falharam. Verifique as imagens do veículo.`,
          variant: "destructive",
        });
      }
    } finally {
      setGenerating(null);
    }
  };

  const vehicleName = (data.brand + " " + data.model).trim() || data.title;

  const SpecRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E5E7EB" }}>
      <span style={{ color: "#6B7280", fontWeight: 600, fontSize: "0.9em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: "#111827", fontWeight: 700, fontSize: "0.95em", textAlign: "right" }}>{value}</span>
    </div>
  );

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        background: LEGA_BLUE,
        color: "#fff",
        padding: "8px 12px",
        fontWeight: 800,
        fontSize: "0.95em",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
    </div>
  );

  const SquareTemplate = ({ w, h }: { w: number; h: number }) => {
    const pad = Math.round(w * 0.025);
    const headerH = Math.round(h * 0.14);
    const footerH = Math.round(h * 0.16);
    const bottomBarH = Math.round(h * 0.045);
    const orangeH = footerH - bottomBarH;
    const bodyH = h - headerH - footerH;
    const leftW = Math.round(w * 0.62);
    const rightW = w - leftW;

    return (
      <div
        style={{
          width: w,
          height: h,
          background: LEGA_GRAY,
          color: "#111827",
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: headerH,
            background: LEGA_BLUE,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${pad * 1.5}px`,
          }}
        >
          <img
            src={LEGA_LOGO}
            alt="LEGA Trucks & Machinery"
            crossOrigin="anonymous"
            style={{ height: headerH * 0.55, objectFit: "contain" }}
          />
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color: "#fff",
                fontSize: headerH * 0.22,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              PARA VENDA
            </div>
            <div style={{ color: LEGA_ORANGE, fontSize: headerH * 0.28, fontWeight: 900, lineHeight: 1.1 }}>
              {data.brand || "LEGA"}
            </div>
            <div style={{ color: "#fff", fontSize: headerH * 0.24, fontWeight: 700, lineHeight: 1.1 }}>
              {data.model || data.title}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ height: bodyH, display: "flex" }}>
          {/* Main image */}
          <div
            style={{
              width: leftW,
              height: bodyH,
              background: "#000",
              position: "relative",
              overflow: "hidden",
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
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9CA3AF",
                  fontSize: w * 0.03,
                  fontWeight: 700,
                }}
              >
                Sem imagem
              </div>
            )}
          </div>

          {/* Specs panel */}
          <div
            style={{
              width: rightW,
              height: bodyH,
              background: LEGA_GRAY,
              padding: `${pad}px`,
              display: "flex",
              flexDirection: "column",
              gap: pad * 0.8,
              overflow: "hidden",
            }}
          >
            <div>
              <SectionHeader>Características técnicas</SectionHeader>
              <div style={{ fontSize: w * 0.022 }}>
                {data.brand && <SpecRow label="Marca" value={data.brand} />}
                {data.model && <SpecRow label="Modelo" value={data.model} />}
                {data.year && <SpecRow label="Ano" value={String(data.year)} />}
                {data.km !== null && data.km !== undefined && <SpecRow label="Quilómetros" value={`${formatNumber(data.km)} km`} />}
                {data.hours !== null && data.hours !== undefined && <SpecRow label="Horas" value={`${formatNumber(data.hours)} h`} />}
                {data.power !== null && data.power !== undefined && <SpecRow label="Potência" value={`${data.power} cv`} />}
              </div>
            </div>

            <div>
              <SectionHeader>Destaques</SectionHeader>
              <div style={{ fontSize: w * 0.022, display: "flex", flexDirection: "column", gap: 6 }}>
                {highlights.map((h) => (
                  <div key={h} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: LEGA_ORANGE, fontWeight: 900, lineHeight: 1.2 }}>✓</span>
                    <span style={{ color: "#111827", fontWeight: 600, lineHeight: 1.2 }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: footerH, display: "flex", flexDirection: "column" }}>
          {/* Orange price/contact bar */}
          <div
            style={{
              height: orangeH,
              background: LEGA_ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `0 ${pad * 1.5}px`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: "#fff",
                  color: LEGA_ORANGE,
                  borderRadius: "50%",
                  width: orangeH * 0.55,
                  height: orangeH * 0.55,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: orangeH * 0.32,
                }}
              >
                €
              </div>
              <div>
                <div style={{ fontSize: orangeH * 0.22, fontWeight: 700, color: "#fff", letterSpacing: 2, textTransform: "uppercase" }}>
                  Preço
                </div>
                <div style={{ fontSize: orangeH * 0.45, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  {formatPrice(data.price)}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", color: "#fff" }}>
              <div style={{ fontSize: orangeH * 0.22, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <svg width={orangeH * 0.22} height={orangeH * 0.22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.56 12.56 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.56 12.56 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {WHATSAPP_DISPLAY}
              </div>
              <div style={{ fontSize: orangeH * 0.24, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <svg width={orangeH * 0.22} height={orangeH * 0.22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {SITE_URL}
              </div>
            </div>
          </div>

          {/* Bottom blue bar */}
          <div
            style={{
              height: bottomBarH,
              background: LEGA_BLUE_DARK,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `0 ${pad}px`,
              fontSize: bottomBarH * 0.45,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Veículo pronto a trabalhar · Entrega imediata em toda a Europa
          </div>
        </div>
      </div>
    );
  };

  const StoryTemplate = ({ w, h }: { w: number; h: number }) => {
    const pad = Math.round(w * 0.04);
    const headerH = Math.round(h * 0.08);
    const titleH = Math.round(h * 0.11);
    const imgH = Math.round(h * 0.34);
    const footerH = Math.round(h * 0.13);
    const bottomBarH = Math.round(h * 0.04);
    const specsH = h - headerH - titleH - imgH - footerH - bottomBarH;

    return (
      <div
        style={{
          width: w,
          height: h,
          background: LEGA_GRAY,
          color: "#111827",
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: headerH,
            background: LEGA_BLUE,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${pad}px`,
          }}
        >
          <img
            src={LEGA_LOGO}
            alt="LEGA Trucks & Machinery"
            crossOrigin="anonymous"
            style={{ height: headerH * 0.55, objectFit: "contain" }}
          />
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: headerH * 0.25, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
              PARA VENDA
            </div>
            <div style={{ color: LEGA_ORANGE, fontSize: headerH * 0.3, fontWeight: 900, lineHeight: 1 }}>
              {data.brand || "LEGA"}
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            height: titleH,
            padding: `${pad}px ${pad}px 0`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ color: LEGA_BLUE, fontSize: titleH * 0.4, fontWeight: 900, lineHeight: 1.05, textTransform: "uppercase" }}>
            {vehicleName}
          </div>
          {data.year && (
            <div style={{ color: LEGA_ORANGE, fontSize: titleH * 0.22, fontWeight: 800, marginTop: 4 }}>
              Ano {data.year}
            </div>
          )}
        </div>

        {/* Image */}
        <div style={{ height: imgH, background: "#000", position: "relative", overflow: "hidden" }}>
          {data.main ? (
            <img
              src={data.main}
              alt={data.title}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9CA3AF",
                fontSize: w * 0.05,
                fontWeight: 700,
              }}
            >
              Sem imagem
            </div>
          )}
        </div>

        {/* Specs */}
        <div
          style={{
            height: specsH,
            padding: `${pad}px`,
            display: "flex",
            flexDirection: "column",
            gap: pad * 0.8,
            overflow: "hidden",
          }}
        >
          <div>
            <SectionHeader>Características técnicas</SectionHeader>
            <div style={{ fontSize: specsH * 0.11 }}>
              {data.km !== null && data.km !== undefined && <SpecRow label="Quilómetros" value={`${formatNumber(data.km)} km`} />}
              {data.hours !== null && data.hours !== undefined && <SpecRow label="Horas" value={`${formatNumber(data.hours)} h`} />}
              {data.power !== null && data.power !== undefined && <SpecRow label="Potência" value={`${data.power} cv`} />}
              {data.model && <SpecRow label="Modelo" value={data.model} />}
            </div>
          </div>
          <div>
            <SectionHeader>Destaques</SectionHeader>
            <div style={{ fontSize: specsH * 0.11, display: "flex", flexDirection: "column", gap: 6 }}>
              {highlights.slice(0, 4).map((h) => (
                <div key={h} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: LEGA_ORANGE, fontWeight: 900, lineHeight: 1.2 }}>✓</span>
                  <span style={{ color: "#111827", fontWeight: 600, lineHeight: 1.2 }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: footerH, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              height: footerH - bottomBarH,
              background: LEGA_ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `0 ${pad}px`,
            }}
          >
            <div>
              <div style={{ fontSize: (footerH - bottomBarH) * 0.2, fontWeight: 700, color: "#fff", letterSpacing: 2, textTransform: "uppercase" }}>
                Preço
              </div>
              <div style={{ fontSize: (footerH - bottomBarH) * 0.42, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                {formatPrice(data.price)}
              </div>
            </div>
            <div style={{ textAlign: "right", color: "#fff" }}>
              <div style={{ fontSize: (footerH - bottomBarH) * 0.2, fontWeight: 800 }}>{WHATSAPP_DISPLAY}</div>
              <div style={{ fontSize: (footerH - bottomBarH) * 0.24, fontWeight: 900 }}>{SITE_URL}</div>
            </div>
          </div>

          <div
            style={{
              height: bottomBarH,
              background: LEGA_BLUE_DARK,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `0 ${pad}px`,
              fontSize: bottomBarH * 0.5,
              fontWeight: 700,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            Entrega imediata em toda a Europa
          </div>
        </div>
      </div>
    );
  };

  const Template = ({ fmt }: { fmt: Format }) => {
    if (fmt.id === "story") return <StoryTemplate w={fmt.width} h={fmt.height} />;
    return <SquareTemplate w={fmt.width} h={fmt.height} />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📢 Gerar Anúncio para Redes Sociais</DialogTitle>
          <DialogDescription>
            Pré-visualização do anúncio gerado a partir dos dados do veículo. Descarregue nos formatos otimizados para
            cada plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Actions */}
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
              {generating === "all" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Descarregar todos
            </Button>
          </div>

          {/* Previews */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {FORMATS.map((f) => {
              const previewW = f.id === "story" ? 200 : 280;
              const scale = previewW / f.width;
              return (
                <div key={f.id} className="space-y-2">
                  <p className="text-sm font-medium text-center">{f.label}</p>
                  <div
                    className="mx-auto border rounded shadow-sm overflow-hidden bg-muted"
                    style={{ width: previewW, height: f.height * scale }}
                  >
                    <div
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                        width: f.width,
                        height: f.height,
                      }}
                    >
                      <div ref={refs[f.id]}>
                        <Template fmt={f} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Dica: se a imagem principal bloquear a geração por CORS, abra-a no navegador para confirmar que está
            acessível, ou faça novo upload através do painel.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialAdGenerator;
