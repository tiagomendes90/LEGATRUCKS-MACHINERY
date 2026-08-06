import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/admin/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, Loader2, Link2, Unlink, RefreshCw, ShieldCheck } from "lucide-react";

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

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("meta-connection", {
      body: { action, ...extra },
    });
    if (error) throw new Error((error as any)?.message ?? "Erro na chamada");
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
      const data = await call("pages");
      setPages(data.pages ?? []);
    });

  const selectPage = (pageId: string) =>
    run(`select-${pageId}`, async () => {
      await call("select_page", { page_id: pageId });
      setPages([]);
      await loadStatus();
      toast({ title: "Página ligada com sucesso" });
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
          <Badge variant={isConnected ? "default" : "secondary"}>
            {connection?.status ?? "não ligado"}
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

        {connection && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Facebook className="h-5 w-5 text-blue-600" />
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
              <Instagram className="h-5 w-5 text-pink-600" />
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

        {connection?.token_expires_at && (
          <p className="text-xs text-muted-foreground">
            Token válido até {new Date(connection.token_expires_at).toLocaleString("pt-PT")}
          </p>
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
      </CardContent>
    </Card>
  );
}
