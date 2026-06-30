import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { HONEYPOT_FIELD } from "@/lib/turnstile";

export interface AntiSpamPayload {
  turnstileToken: string | null;
  honeypot: string;
  elapsedMs: number;
}

export interface AntiSpamFieldsHandle {
  /** Snapshot the current payload at submit time. */
  getPayload: () => AntiSpamPayload;
  reset: () => void;
}

interface Props {
  /** Fires whenever the Turnstile token changes (ready / expired). */
  onTokenChange?: (token: string | null) => void;
  className?: string;
}

/**
 * Reusable anti-spam bundle: honeypot + Turnstile + render-time tracker.
 * Drop this into any form to inherit the same anti-spam pipeline used
 * everywhere on the site.
 */
const AntiSpamFields = forwardRef<AntiSpamFieldsHandle, Props>(
  ({ onTokenChange, className }, ref) => {
    const [honeypot, setHoneypot] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const mountedAtRef = useRef<number>(Date.now());

    useEffect(() => {
      mountedAtRef.current = Date.now();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getPayload: () => ({
          turnstileToken: token,
          honeypot,
          elapsedMs: Date.now() - mountedAtRef.current,
        }),
        reset: () => {
          setHoneypot("");
          mountedAtRef.current = Date.now();
        },
      }),
      [token, honeypot],
    );

    return (
      <>
        <div
          aria-hidden="true"
          className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor={HONEYPOT_FIELD}>Do not fill</label>
          <input
            id={HONEYPOT_FIELD}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>
        <TurnstileWidget
          className={className}
          onToken={(t) => {
            setToken(t);
            onTokenChange?.(t);
          }}
        />
      </>
    );
  },
);

AntiSpamFields.displayName = "AntiSpamFields";

export default AntiSpamFields;