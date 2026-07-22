import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import {
  usePublishingChannels,
  useToggleChannel,
  usePublishingEvents,
  usePublishingLogs,
  useRetryEvent,
  usePublishingTransitions,
} from "@/hooks/usePublishing";

const statusVariant = (status: string) => {
  switch (status) {
    case "success":
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "processing":
    case "pending":
    case "scheduled":
      return "secondary";
    default:
      return "outline";
  }
};

/**
 * Renders a friendly breakdown of a Meta Graph API error envelope so the admin
 * sees the exact message + code + subcode + trace, not just a generic "failed".
 * The raw JSON is still shown below for deep debugging.
 */
function MetaErrorBlock({ error }: { error: any }) {
  if (!error || typeof error !== "object") return null;
  return (
    <div className="mt-1 rounded border border-destructive/40 bg-destructive/5 p-2 text-xs">
      {error.message && (
        <p className="text-destructive font-medium">{error.message}</p>
      )}
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground font-mono">
        {error.code !== undefined && <span>code: {String(error.code)}</span>}
        {error.error_subcode !== undefined && (
          <span>subcode: {String(error.error_subcode)}</span>
        )}
        {error.type && <span>type: {String(error.type)}</span>}
        {error.fbtrace_id && <span>trace: {String(error.fbtrace_id)}</span>}
      </div>
      {error.error_user_title && (
        <p className="mt-1 font-medium">{String(error.error_user_title)}</p>
      )}
      {error.error_user_msg && (
        <p className="text-muted-foreground">{String(error.error_user_msg)}</p>
      )}
    </div>
  );
}

function EventRow({ evt }: { evt: any }) {
  const [open, setOpen] = useState(false);
  const { data: logs = [] } = usePublishingLogs(open ? evt.id : null);
  const { data: transitions = [] } = usePublishingTransitions(open ? evt.id : null);
  const retry = useRetryEvent();

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/40 text-left"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-mono text-xs text-muted-foreground">
            {new Date(evt.created_at).toLocaleString("pt-PT")}
          </span>
          <span className="font-medium">{evt.event_type}</span>
          {evt.product_id && (
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
              {evt.product_id}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {typeof evt.attempts === "number" && evt.attempts > 0 && (
            <span className="text-xs text-muted-foreground">tent. {evt.attempts}</span>
          )}
          {typeof evt.retry_cycle === "number" && evt.retry_cycle > 0 && (
            <span className="text-xs text-muted-foreground">ciclo {evt.retry_cycle}</span>
          )}
          <Badge variant={statusVariant(evt.status) as any}>{evt.status}</Badge>
        </div>
      </button>
      {open && (
        <div className="border-t p-3 space-y-2 bg-muted/20">
          {evt.last_error && (
            <p className="text-xs text-destructive">Último erro: {evt.last_error}</p>
          )}
          {evt.next_attempt_at && (
            <p className="text-xs text-muted-foreground">
              Próxima tentativa: {new Date(evt.next_attempt_at).toLocaleString("pt-PT")}
            </p>
          )}
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registos ainda.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex items-start justify-between text-sm gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.channel_key}</span>
                    <Badge variant={statusVariant(l.status) as any}>{l.status}</Badge>
                    <span className="text-xs text-muted-foreground">tent. {l.attempts}</span>
                  </div>
                  {l.error && <p className="text-xs text-destructive mt-1">{l.error}</p>}
                  {l.response && (l.response as any).error && (
                    <MetaErrorBlock error={(l.response as any).error} />
                  )}
                  {l.response && Object.keys(l.response).length > 0 && (
                    <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                      {JSON.stringify(l.response, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
          {transitions.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-1">Auditoria de estados</p>
              <ul className="space-y-1">
                {transitions.map((t) => (
                  <li key={t.id} className="text-xs text-muted-foreground font-mono">
                    {new Date(t.created_at).toLocaleString("pt-PT")} ·{" "}
                    {t.from_status ?? "∅"} → {t.to_status}
                    {t.retry_cycle ? ` · ciclo ${t.retry_cycle}` : ""}
                    {t.attempts ? ` · tent. ${t.attempts}` : ""}
                    {t.worker ? ` · ${t.worker}` : ""}
                    {t.reason ? ` · ${t.reason}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => retry.mutate(evt.id)}
              disabled={retry.isPending}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Reenviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublishingPanel() {
  const { data: channels = [], isLoading } = usePublishingChannels();
  const toggle = useToggleChannel();
  const { data: events = [] } = usePublishingEvents(30);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Canais de Publicação</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : (
            <div className="space-y-2">
              {channels.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.key}</p>
                  </div>
                  <Switch
                    checked={c.enabled}
                    onCheckedChange={(enabled) => toggle.mutate({ key: c.key, enabled })}
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Adicionar um novo canal (LinkedIn, WhatsApp, …) requer apenas criar um novo adaptador em{" "}
            <code>supabase/functions/_shared/publishing/channels/</code> e registá-lo no{" "}
            <code>index.ts</code>. O restante fluxo é automático.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há eventos.</p>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <EventRow key={e.id} evt={e} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}