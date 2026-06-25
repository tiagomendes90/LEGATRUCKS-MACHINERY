import i18n from "i18next";

/**
 * Maps backend / Turnstile error codes to user-friendly, translated toast
 * payloads. Never expose raw codes like `turnstile_failed` or `too_fast`
 * to end users.
 */
export type AntiSpamToast = {
  title: string;
  description: string;
  variant: "destructive";
};

const t = (key: string) => i18n.t(key);

export function mapAntiSpamError(rawMessage: unknown): AntiSpamToast {
  const code = String(
    (rawMessage && typeof rawMessage === "object" && "message" in (rawMessage as any)
      ? (rawMessage as any).message
      : rawMessage) ?? ""
  )
    .toLowerCase()
    .trim();

  // Turnstile-specific
  if (code.includes("missing_turnstile") || code === "verification_required") {
    return {
      title: t("antiSpam.verificationRequiredTitle"),
      description: t("antiSpam.verificationRequired"),
      variant: "destructive",
    };
  }
  if (
    code.includes("turnstile_failed") ||
    code.includes("invalid-input-response") ||
    code.includes("timeout-or-duplicate") ||
    code.includes("expired") ||
    code === "verification_expired"
  ) {
    return {
      title: t("antiSpam.verificationExpiredTitle"),
      description: t("antiSpam.verificationExpired"),
      variant: "destructive",
    };
  }
  if (code.includes("too_fast")) {
    return {
      title: t("antiSpam.tooFastTitle"),
      description: t("antiSpam.tooFast"),
      variant: "destructive",
    };
  }
  if (code.startsWith("invalid_") || code === "invalid_json") {
    return {
      title: t("antiSpam.invalidDataTitle"),
      description: t("antiSpam.invalidData"),
      variant: "destructive",
    };
  }
  return {
    title: t("antiSpam.genericErrorTitle"),
    description: t("antiSpam.genericError"),
    variant: "destructive",
  };
}