import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

type Preferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "cookie-preferences";

const CookieBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const savePreferences = (prefs: Preferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
    setVisible(false);
    setCustomize(false);
  };

  const acceptAll = () =>
    savePreferences({ necessary: true, analytics: true, marketing: true });

  const rejectAll = () =>
    savePreferences({ necessary: true, analytics: false, marketing: false });

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookies.title")}
      className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6"
    >
      <div className="mx-auto max-w-5xl bg-background border border-border shadow-2xl rounded-xl p-5 md:p-6">
        {!customize ? (
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground mb-1">
                {t("cookies.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("cookies.description")}{" "}
                <Link
                  to="/privacy"
                  className="underline text-foreground hover:text-primary"
                >
                  {t("footer.privacyPolicy")}
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
              <Button variant="outline" onClick={rejectAll}>
                {t("cookies.reject")}
              </Button>
              <Button variant="outline" onClick={() => setCustomize(true)}>
                {t("cookies.customize")}
              </Button>
              <Button onClick={acceptAll}>{t("cookies.acceptAll")}</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {t("cookies.preferencesTitle")}
              </h2>
              <button
                aria-label="Close"
                onClick={() => setCustomize(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {t("cookies.necessary")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("cookies.necessaryDesc")}
                  </p>
                </div>
                <Switch checked disabled />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {t("cookies.analytics")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("cookies.analyticsDesc")}
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(v) =>
                    setPreferences((p) => ({ ...p, analytics: v }))
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {t("cookies.marketing")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("cookies.marketingDesc")}
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(v) =>
                    setPreferences((p) => ({ ...p, marketing: v }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end mt-6">
              <Button variant="outline" onClick={rejectAll}>
                {t("cookies.reject")}
              </Button>
              <Button onClick={() => savePreferences(preferences)}>
                {t("cookies.savePreferences")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieBanner;