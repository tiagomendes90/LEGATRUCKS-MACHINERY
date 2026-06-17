/**
 * WhatsApp utility — single source of truth for the LEGA contact number.
 * `wa.me` links automatically open WhatsApp Web on desktop and the native app on mobile.
 */

export const WHATSAPP_NUMBER = "351912406089";
export const WHATSAPP_DISPLAY = "+351 912 406 089";

export const getWhatsAppUrl = (message?: string): string => {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
};

export const openWhatsApp = (message?: string): void => {
  window.open(getWhatsAppUrl(message), "_blank", "noopener,noreferrer");
};
