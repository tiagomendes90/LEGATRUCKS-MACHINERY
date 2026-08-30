/**
 * Company data — single source of truth for LEGA's official contacts and address.
 */

export const COMPANY_NAME = "LEGA Trucks & Machinery";
export const COMPANY_EMAIL = "info@lega.pt";

export const COMPANY_ADDRESS = {
  street: "Travessa do Monte, nº 560",
  postalCode: "4765-326",
  locality: "Oliveira Santa Maria",
  region: "Vila Nova de Famalicão",
  country: "Portugal",
} as const;

/** Lines used for stacked display (footer, contact page). */
export const COMPANY_ADDRESS_LINES = [
  COMPANY_ADDRESS.street,
  `${COMPANY_ADDRESS.postalCode} ${COMPANY_ADDRESS.locality}`,
  `${COMPANY_ADDRESS.region}, ${COMPANY_ADDRESS.country}`,
];

/** Single-line address. */
export const COMPANY_ADDRESS_LINE = COMPANY_ADDRESS_LINES.join(", ");

/** Google Maps search link built from the official address. */
export const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  COMPANY_ADDRESS_LINE,
)}`;

/** Google Maps embed URL built from the official address. */
export const GOOGLE_MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  COMPANY_ADDRESS_LINE,
)}&output=embed`;
