import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Facebook,
  Instagram,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  XCircle,
  Send,
  Trash2,
  History,
} from "lucide-react";
import {
  useSocialMetrics,
  useSocialTimeline,
  SOCIAL_CHANNELS,
  type SocialChannelKey,
  type SocialTimelineEntry,
} from "@/hooks/useSocialOperations";

const CHANNEL_ICON: Record<SocialChannelKey, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
};

const CHANNEL_LABEL: Record<SocialChannelKey, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  "social.publish.confirmed": "Publicação",
  "social.republish": "Republicação",
  "social.delete": "Eliminação",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  scheduled: "outline",
  processing: "secondary",
  success: "default",
  succeeded: "default",
  failed: "destructive",
  skipped: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  scheduled: "Agendado",
  processing: "Em processamento",
  success: "Concluído",
  succeeded: "Concluído",
  failed: "Falhado",
  skipped: "Ignorado",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function EventIcon({ type }: { type: string }) {
  if (type === "social.delete") return <Trash2 className="h-4 w-4 text-destructive" />;
  if (type === "social.republish") return <RefreshCw className="h-4 w-4 text-primary" />;
  return <Send className="h-4 w-4 text-primary" />;
}

function ChannelIcon({ channel }: { channel: string | null }) {
  if (channel && SOCIAL_CHANNELS.includes(channel as SocialChannelKey)) {
    const Icon = CHANNEL_ICON[channel as SocialChannelKey];
    return <Icon className="h-3 w-3" />;
  }
  return null;
}

function MetricTile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Facebook;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClasses =
    tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
      ? "bg-amber-500/10 text-amber-600"
      : tone === "success"
      ? "bg-emerald-500/10 text-emerald-600"
      : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {hint && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{hint}</p>
            )}
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneClasses}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SocialOperationsOverview() {
  const { data: metrics, isLoading: mLoading } = useSocialMetrics();
  const { data: timeline = [], isLoading: tLoading } = useSocialTimeline(40);

  return (
    <div className="space-y-6">
      {/* Global product status metrics */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Estado dos produtos
        </h3>
        {mLoading || !metrics ? (
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            <MetricTile
              icon={Clock}
              label="Prontos para publicar"
              value={metrics.ready_for_social}
              tone="warning"
            />
            <MetricTile
              icon={CheckCircle2}
              label="Publicados"
              value={metrics.published}
              tone="success"
            />
            <MetricTile
              icon={AlertTriangle}
              label="Desatualizados"
              value={metrics.outdated}
              tone="danger"
            />
            <MetricTile
              icon={History}
              label="Ativos no total"
              value={metrics.total_active}
              hint={`${metrics.not_ready} rascunho(s)`}
            />
          </div>
        )}
      </section>

      {/* Event pipeline metrics */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Fila de eventos sociais
        </h3>
        {mLoading || !metrics ? (
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <MetricTile
              icon={Clock}
              label="Eventos pendentes"
              value={metrics.events_pending}
              hint="Aguardam despacho"
            />
            <MetricTile
              icon={RefreshCw}
              label="Em processamento"
              value={metrics.events_processing}
              tone="warning"
            />
            <MetricTile
              icon={XCircle}
              label="Falhados"
              value={metrics.events_failed}
              tone={metrics.events_failed > 0 ? "danger" : "default"}
            />
          </div>
        )}
      </section>

      {/* Per-channel metrics */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Canais
        </h3>
        {mLoading || !metrics ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {metrics.channels.map((c) => {
              const Icon = CHANNEL_ICON[c.channel];
              return (
                <Card key={c.channel}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {CHANNEL_LABEL[c.channel]}
                    </CardTitle>
                    {c.failed_events_24h > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {c.failed_events_24h} falha(s) 24h
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Posts ao vivo</p>
                      <p className="text-xl font-semibold">{c.live_posts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Retries 24h</p>
                      <p className="text-xl font-semibold">{c.retries_24h}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Falhas 24h</p>
                      <p className="text-xl font-semibold">{c.failed_events_24h}</p>
                    </div>
                    <div className="col-span-3 pt-2 border-t">
                      <p className="text-[11px] text-muted-foreground">
                        Última publicação: {formatDateTime(c.last_event_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Timeline */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Histórico recente
        </h3>
        <Card>
          <CardContent className="p-0">
            {tLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Sem eventos sociais recentes.
              </p>
            ) : (
              <ul className="divide-y">
                {timeline.map((t) => (
                  <TimelineRow key={t.id} entry={t} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function TimelineRow({ entry }: { entry: SocialTimelineEntry }) {
  const variant = STATUS_VARIANT[entry.to_status] ?? "outline";
  const label = STATUS_LABEL[entry.to_status] ?? entry.to_status;
  return (
    <li className="flex items-start gap-3 p-3">
      <div className="mt-1">
        <EventIcon type={entry.event_type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium truncate">
            {EVENT_TYPE_LABEL[entry.event_type] ?? entry.event_type}
          </span>
          {entry.channel && (
            <Badge variant="outline" className="text-[10px] flex items-center gap-1">
              <ChannelIcon channel={entry.channel} />
              {CHANNEL_LABEL[entry.channel as SocialChannelKey] ?? entry.channel}
            </Badge>
          )}
          <Badge variant={variant} className="text-[10px]">
            {entry.from_status ? `${entry.from_status} → ${label}` : label}
          </Badge>
          {(entry.retry_cycle ?? 0) > 0 && (
            <Badge variant="outline" className="text-[10px]">
              ciclo #{entry.retry_cycle}
            </Badge>
          )}
          {(entry.attempts ?? 0) > 1 && (
            <Badge variant="outline" className="text-[10px]">
              tentativa {entry.attempts}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {entry.product_title ?? entry.product_id ?? "—"}
          {entry.reason ? ` · ${entry.reason}` : ""}
        </p>
      </div>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
        {formatDateTime(entry.created_at)}
      </span>
    </li>
  );
}