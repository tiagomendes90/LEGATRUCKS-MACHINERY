import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface LangOption {
  code: string;
  native_label: string;
  flag_emoji: string | null;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-view`;

const NewsletterView = () => {
  const { number } = useParams();
  const [params, setParams] = useSearchParams();
  const lang = params.get("lang") ?? "";
  const token = params.get("t") ?? "";

  const [html, setHtml] = useState("");
  const [subject, setSubject] = useState("");
  const [languages, setLanguages] = useState<LangOption[]>([]);
  const [current, setCurrent] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams({ n: String(number ?? ""), format: "json" });
    if (lang) qs.set("lang", lang);
    if (token) qs.set("t", token);
    return `${FN_URL}?${qs.toString()}`;
  }, [number, lang, token]);

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (!data?.ok) {
          setState("error");
          return;
        }
        setHtml(data.html ?? "");
        setSubject(data.subject ?? "");
        setLanguages(data.languages ?? []);
        setCurrent(data.language ?? "");
        setState("ready");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [endpoint]);

  useEffect(() => {
    if (subject) document.title = `${subject} | LEGA`;
  }, [subject]);

  const switchLang = (code: string) => {
    const next = new URLSearchParams(params);
    next.set("lang", code);
    setParams(next, { replace: true });
  };

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-sm font-semibold text-foreground">
            {subject || "Newsletter LEGA"}
          </h1>
          {languages.length > 1 && (
            <nav className="flex items-center gap-1" aria-label="Idioma">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => switchLang(l.code)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    l.code === current
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {l.flag_emoji ? `${l.flag_emoji} ` : ""}
                  {l.native_label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-2 py-6">
        {state === "loading" && (
          <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
          </div>
        )}
        {state === "error" && (
          <p className="py-24 text-center text-muted-foreground">
            Esta newsletter não está disponível.
          </p>
        )}
        {state === "ready" && (
          <iframe
            title={subject || "Newsletter"}
            srcDoc={html}
            className="h-[85vh] w-full rounded-lg border bg-background"
          />
        )}
      </div>
    </main>
  );
};

export default NewsletterView;
