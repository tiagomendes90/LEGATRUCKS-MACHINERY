import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { renderCreative } from "@/lib/creative/render";
import type { CreativeData, TemplateConfig } from "@/lib/creative/types";

interface Props {
  data: CreativeData;
  config: TemplateConfig;
  imageUrl: string;
  headline?: string;
  sold?: boolean;
  soldLabel?: string;
  width?: number;
  onCanvas?: (canvas: HTMLCanvasElement | null) => void;
}

/** Pré-visualização fiel: render nativo 1080×1920 apresentado à escala. */
export function CreativePreview({
  data,
  config,
  imageUrl,
  headline,
  sold,
  soldLabel,
  width = 300,
  onCanvas,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    renderCreative({ data, config, imageUrl, headline, sold, soldLabel })
      .then((canvas) => {
        if (cancelled) return;
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";
        const node = holder.current;
        if (node) {
          node.innerHTML = "";
          node.appendChild(canvas);
        }
        onCanvas?.(canvas);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ?? "Falha ao gerar pré-visualização");
        onCanvas?.(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, JSON.stringify(config), imageUrl, headline, sold, soldLabel]);

  return (
    <div
      className="relative overflow-hidden rounded-xl border bg-muted shadow-sm"
      style={{ width, aspectRatio: "1080 / 1920" }}
    >
      <div ref={holder} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

export default CreativePreview;
