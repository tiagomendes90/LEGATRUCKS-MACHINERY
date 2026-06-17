import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACCESS_CODE = "lega2026";
const STORAGE_KEY = "site_access_granted";

const AccessGate = ({ children }: { children: React.ReactNode }) => {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setGranted(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, "true");
      setGranted(true);
    } else {
      setError(true);
    }
  };

  if (granted === null) return null;
  if (granted) return <>{children}</>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Acesso restrito
          </h1>
          <p className="text-muted-foreground">
            Este site encontra-se em desenvolvimento. Introduza o código de acesso para continuar.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Código de acesso"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
            autoFocus
            aria-label="Código de acesso"
          />
          {error && (
            <p className="text-sm text-destructive">Código incorreto. Tente novamente.</p>
          )}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </div>
    </main>
  );
};

export default AccessGate;