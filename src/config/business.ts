/**
 * Business details confirmed by the owner (see docs/AUDIT.md).
 * Admin → Settings can override most of these at runtime; these values are
 * the fallbacks used before settings load and when the database is empty.
 */
export const BUSINESS_DEFAULTS = {
  name: "Elevate Real Estate",
  shortName: "ERE",
  legalName: "ERE — Elevate Real Estate",
  phoneDisplay: "082 474 1178",
  phoneE164: "+27824741178",
  whatsappE164: "+27824741178",
  whatsappEnabled: true,
  email: "admin@elevaterealestate.co.za",
  emailVerified: true,
  streetAddress: "163B Market Street",
  suburb: "Parow Valley",
  city: "Cape Town",
  postalCode: "7500",
  region: "Western Cape",
  country: "South Africa",
  countryCode: "ZA",
  // Free text, e.g. "Mon–Fri 08:30–17:00". Empty = not shown (never invented).
  hours: "",
  // PPRA Fidelity Fund Certificate number and other disclosures, once supplied.
  disclosures: "",
} as const;

/** Owner details confirmed by the business (shown on the About page and as POPIA Information Officer). */
export const OWNER_DEFAULTS = {
  name: "Mario Lennards",
  role: "Owner & estate agent",
  bio: "Mario Lennards is the owner of ERE and an estate agent with many years of experience in the property industry. His aim is simple: to help families find, buy and move into their dream homes, and to guide every client through the process with honest, clear communication.",
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function officeAddressLines(b: {
  streetAddress: string;
  suburb: string;
  city: string;
  postalCode: string;
}) {
  return [b.streetAddress, b.suburb, `${b.city}, ${b.postalCode}`].filter(Boolean);
}

export function officeMapsQuery(b: { streetAddress: string; suburb: string; city: string; postalCode: string }) {
  return `${b.streetAddress}, ${b.suburb}, ${b.city}, ${b.postalCode}, South Africa`;
}

export const PRIVACY_NOTICE_VERSION = "2026-10-18";
