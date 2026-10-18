import { z } from "zod";
import { BUSINESS_DEFAULTS, OWNER_DEFAULTS } from "@/config/business";
import type { Db } from "./db";
import { settings } from "./db/schema";

const e164 = z.string().trim().regex(/^\+\d{8,15}$/, "Use international format, e.g. +27821234567");
const optionalUrl = (hosts: string[]) =>
  z
    .string()
    .trim()
    .max(300)
    .refine((v) => {
      if (v === "") return true;
      try {
        const u = new URL(v);
        return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
      } catch {
        return false;
      }
    }, `Must be an https:// link on ${hosts.join(" or ")}`);

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phoneDisplay: z.string().trim().min(6).max(30),
  phoneE164: e164,
  whatsappE164: e164,
  whatsappEnabled: z.boolean(),
  email: z.union([z.literal(""), z.email().max(120)]),
  emailVerified: z.boolean(),
  streetAddress: z.string().trim().min(3).max(120),
  suburb: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(10),
  hours: z.string().trim().max(400),
  disclosures: z.string().trim().max(1000),
});

export const socialSettingsSchema = z.object({
  facebook: optionalUrl(["facebook.com"]),
  instagram: optionalUrl(["instagram.com"]),
  linkedin: optionalUrl(["linkedin.com"]),
});

export const visibilitySettingsSchema = z.object({
  showUnderOffer: z.boolean(),
  showSold: z.boolean(),
  showLet: z.boolean(),
});

export const aboutSettingsSchema = z.object({
  ownerName: z.string().trim().max(80),
  ownerRole: z.string().trim().max(80),
  ownerBio: z.string().trim().max(3000),
  foundedYear: z.number().int().min(1950).max(2100).nullable(),
  areasServed: z.array(z.string().trim().min(2).max(60)).max(40),
});

export const seoSettingsSchema = z.object({
  defaultDescription: z.string().trim().min(20).max(300),
});

export const SETTINGS_SCHEMAS = {
  business: businessSettingsSchema,
  social: socialSettingsSchema,
  visibility: visibilitySettingsSchema,
  about: aboutSettingsSchema,
  seo: seoSettingsSchema,
} as const;

export type SettingsKey = keyof typeof SETTINGS_SCHEMAS;
export type SiteSettings = { [K in SettingsKey]: z.infer<(typeof SETTINGS_SCHEMAS)[K]> };

export const DEFAULT_SETTINGS: SiteSettings = {
  business: {
    name: BUSINESS_DEFAULTS.name,
    phoneDisplay: BUSINESS_DEFAULTS.phoneDisplay,
    phoneE164: BUSINESS_DEFAULTS.phoneE164,
    whatsappE164: BUSINESS_DEFAULTS.whatsappE164,
    whatsappEnabled: BUSINESS_DEFAULTS.whatsappEnabled,
    email: BUSINESS_DEFAULTS.email,
    emailVerified: BUSINESS_DEFAULTS.emailVerified,
    streetAddress: BUSINESS_DEFAULTS.streetAddress,
    suburb: BUSINESS_DEFAULTS.suburb,
    city: BUSINESS_DEFAULTS.city,
    postalCode: BUSINESS_DEFAULTS.postalCode,
    hours: BUSINESS_DEFAULTS.hours,
    disclosures: BUSINESS_DEFAULTS.disclosures,
  },
  social: { facebook: "", instagram: "", linkedin: "" },
  visibility: { showUnderOffer: true, showSold: false, showLet: false },
  about: { ownerName: OWNER_DEFAULTS.name, ownerRole: OWNER_DEFAULTS.role, ownerBio: OWNER_DEFAULTS.bio, foundedYear: null, areasServed: [] },
  seo: {
    defaultDescription:
      "Elevate Real Estate (ERE) is a Parow-based estate agency helping buyers and sellers across Cape Town. Browse properties, request a valuation or speak to the team.",
  },
};

/** Reads all settings; any missing or invalid group falls back to its defaults. */
export async function loadSettings(db: Db): Promise<SiteSettings> {
  const rows = await db.select().from(settings);
  const out = structuredClone(DEFAULT_SETTINGS) as SiteSettings;
  for (const row of rows) {
    const key = row.key as SettingsKey;
    const schema = SETTINGS_SCHEMAS[key];
    if (!schema) continue;
    const parsed = schema.safeParse({ ...DEFAULT_SETTINGS[key], ...(row.value as object) });
    if (parsed.success) (out as Record<SettingsKey, unknown>)[key] = parsed.data;
  }
  return out;
}

export async function saveSettings<K extends SettingsKey>(db: Db, key: K, value: SiteSettings[K], adminId: string | null) {
  const data = SETTINGS_SCHEMAS[key].parse(value);
  await db
    .insert(settings)
    .values({ key, value: data, updatedBy: adminId })
    .onConflictDoUpdate({ target: settings.key, set: { value: data, updatedAt: new Date(), updatedBy: adminId } });
}

/** Contact details safe to show publicly. */
export function publicContact(s: SiteSettings) {
  const b = s.business;
  return {
    name: b.name,
    phoneDisplay: b.phoneDisplay,
    phoneE164: b.phoneE164,
    whatsappE164: b.whatsappEnabled ? b.whatsappE164 : null,
    email: b.emailVerified && b.email ? b.email : null,
    streetAddress: b.streetAddress,
    suburb: b.suburb,
    city: b.city,
    postalCode: b.postalCode,
    hours: b.hours,
    disclosures: b.disclosures,
    social: s.social,
  };
}
export type PublicContact = ReturnType<typeof publicContact>;

export function publicStatuses(v: SiteSettings["visibility"]) {
  const statuses: ("available" | "under_offer" | "sold" | "let")[] = ["available"];
  if (v.showUnderOffer) statuses.push("under_offer");
  if (v.showSold) statuses.push("sold");
  if (v.showLet) statuses.push("let");
  return statuses;
}
