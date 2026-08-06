import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/admin/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, Loader2, Link2, Unlink, RefreshCw, ShieldCheck, RotateCw, Clock } from "lucide-react";

interface MetaConnection {
  id: string;
  status: string;
  page_id: string | null;
  page_name: string | null;
  page_picture_url: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
  ig_profile_picture_url: string | null;
  token_expires_at: string | null;
  has_page_token: boolean;
  scopes: string[] | null;
  connected_at: string | null;
  last_checked_at: string | null;
  last_error: string | null;
}

interface MetaPage {
  id: string;
  name: string;
  picture_url: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
}

export default function MetaConnectionPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");
  const [connection, setConnection] = useState<MetaConnection | null>(null);
  const [pages, setPages] = useState<MetaPage[]>([]);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [pagesIssue, setPagesIssue] = useState<{ reason: string; message: string } | null>(null);

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("meta-connection", {
      body: { action, ...extra },
    });
    if (error) {
      // Extrai a mensagem real devolvida pela Edge Function em vez do texto genérico
      let detail: string | null = null;
      try {
        const body = await (error as any)?.context?.json?.();
        detail = body?.error ?? null;
      } catch {
        detail = null;
      }
      throw new Error(detail ?? (error as any)?.message ?? "Erro na chamada à Edge Function");
    }
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  }, []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call("status");
      setConfigured(!!data.configured);
      setRedirectUri(data.redirect_uri ?? "");
      setConnection(data.connection ?? null);
    } catch (err) {
      toast({
        title: "Não foi possível ler o estado da ligação Meta",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if ((e.data as any)?.type === "meta-oauth") loadStatus();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loadStatus]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const connect = () =>
    run("connect", async () => {
      const { url } = await call("oauth_url");
      window.open(url, "meta-oauth", "width=680,height=760");
    });

  const listPages = () =>
    run("pages", async () => {
      const { data, error } = await supabase.functions.invoke("meta-connection", {
        body: { action: "pages" },
      });
      if (error) throw new Error((error as any)?.message ?? "Erro na chamada à Edge Function");
      const result = data as any;
      setPages(result?.pages ?? []);
      setPagesLoaded(true);
      if (result?.error) {
        setPagesIssue({ reason: result.reason ?? "unknown", message: result.error });
        await loadStatus();
        toast({
          title: "Nenhuma Página disponível",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setPagesIssue(null);
      }
    });

  const selectPage = (pageId: string) =>
    run(`select-${pageId}`, async () => {
      await call("select_page", { page_id: pageId });
      setPages([]);
      setPagesLoaded(false);
      await loadStatus();
      toast({ title: "Página ligada com sucesso" });
    });

  const renew = () =>
    run("renew", async () => {
      const data = await call("refresh");
      await loadStatus();
      toast({
        title: data.ok ? "Ligação renovada" : "Não foi possível renovar",
        description: data.error ?? undefined,
        variant: data.ok ? "default" : "destructive",
      });
    });

  const verify = () =>
    run("verify", async () => {
      const data = await call("verify");
      await loadStatus();
      toast({
        title: data.ok ? "Ligação válida" : "Token inválido ou expirado",
        variant: data.ok ? "default" : "destructive",
      });
    });

  const disconnect = () =>
    run("disconnect", async () => {
      await call("disconnect");
      setPages([]);
      setPagesLoaded(false);
      await loadStatus();
      toast({ title: "Ligação Meta removida" });
    });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar ligação Meta…
        </CardContent>
      </Card>
    );
  }

  const isConnected = connection?.status === "connected" && connection.has_page_token;
  const expiresInDays = connection?.token_expires_at
    ? Math.max(
        0,
        Math.round(
          (new Date(connection.token_expires_at).getTime() - Date.now()) / 86_400_000,
        ),
      )
    : null;
  const statusLabel: Record<string, string> = {
    connected: "Ligado",
    pending_page_selection: "Falta escolher página",
    no_pages_available: "Sem acesso à Página",
    expired: "Token expirado",
    disconnected: "Desligado",
    replaced: "Substituído",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Ligação Meta (Facebook & Instagram)
            </CardTitle>
            <CardDescription>
              Liga as contas por OAuth — sem configurar IDs manualmente.
            </CardDescription>
          </div>
          <Badge
            variant={
              isConnected ? "default" : connection?.status === "expired" ? "destructive" : "secondary"
            }
          >
            {connection ? statusLabel[connection.status] ?? connection.status : "Não ligado"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!configured && (
          <Alert variant="destructive">
            <AlertDescription>
              Faltam os segredos <strong>META_APP_ID</strong> e <strong>META_APP_SECRET</strong>.
              Configura-os antes de ligar a conta. URL de redirecionamento a registar na App Meta:{" "}
              <code className="break-all">{redirectUri}</code>
            </AlertDescription>
          </Alert>
        )}

        {connection?.last_error && (
          <Alert variant="destructive">
            <AlertDescription className="break-words">{connection.last_error}</AlertDescription>
          </Alert>
        )}

        {connection?.status === "pending_page_selection" && (
          <Alert>
            <AlertDescription>
              A autenticação foi concluída. Clica em <strong>Escolher página</strong> para
              selecionar a Página Facebook que a Meta disponibilizou a esta ligação.
            </AlertDescription>
          </Alert>
        )}

        {connection && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              {connection.page_picture_url ? (
                <img
                  src={connection.page_picture_url}
                  alt={connection.page_name ?? "Página Facebook"}
                  className="h-9 w-9 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Facebook className="h-5 w-5 text-blue-600" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {connection.page_name ?? "Página não selecionada"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {connection.page_id ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              {connection.ig_profile_picture_url ? (
                <img
                  src={connection.ig_profile_picture_url}
                  alt={connection.ig_username ?? "Conta Instagram"}
                  className="h-9 w-9 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Instagram className="h-5 w-5 text-pink-600" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {connection.ig_username ? `@${connection.ig_username}` : "Sem conta Instagram Business"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {connection.ig_user_id ?? "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {connection && (
          <div className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground sm:grid-cols-2">
            <p className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Token válido até:{" "}
              <span className="font-medium text-foreground">
                {connection.token_expires_at
                  ? new Date(connection.token_expires_at).toLocaleString("pt-PT")
                  : "sem expiração"}
              </span>
              {expiresInDays !== null && (
                <span className={expiresInDays <= 14 ? "text-destructive" : ""}>
                  ({expiresInDays} dias)
                </span>
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Última sincronização:{" "}
              <span className="font-medium text-foreground">
                {connection.last_checked_at
                  ? new Date(connection.last_checked_at).toLocaleString("pt-PT")
                  : "nunca"}
              </span>
            </p>
            {connection.connected_at && (
              <p>Ligado em {new Date(connection.connected_at).toLocaleString("pt-PT")}</p>
            )}
            {connection.scopes?.length ? (
              <p className="truncate">Permissões: {connection.scopes.join(", ")}</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={connect} disabled={!configured || busy !== null}>
            {busy === "connect" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            {connection ? "Reconectar" : "Ligar conta Meta"}
          </Button>
          {connection && (
            <>
              <Button variant="outline" onClick={listPages} disabled={busy !== null}>
                {busy === "pages" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Escolher página
              </Button>
              <Button variant="outline" onClick={renew} disabled={busy !== null}>
                {busy === "renew" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="mr-2 h-4 w-4" />
                )}
                Renovar ligação
              </Button>
              <Button variant="outline" onClick={verify} disabled={busy !== null}>
                {busy === "verify" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Validar ligação
              </Button>
              <Button variant="destructive" onClick={disconnect} disabled={busy !== null}>
                <Unlink className="mr-2 h-4 w-4" />
                Desligar
              </Button>
            </>
          )}
        </div>

        {pages.length > 0 && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Páginas disponíveis</p>
            {pages.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.ig_username ? `Instagram: @${p.ig_username}` : "Sem Instagram Business"}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => selectPage(p.id)}
                  disabled={busy !== null}
                >
                  {busy === `select-${p.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Selecionar"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {pagesLoaded && pages.length === 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              A Meta não devolveu nenhuma Página para esta conta. Na janela de autorização,
              confirma que selecionaste a Página LEGA e lhe deste acesso. Se a Página pertence a
              um Business Portfolio, o teu utilizador também precisa de acesso total à Página.
              Depois usa <strong>Reconectar</strong> e volta a autorizar.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
