import { z } from "zod";
import { contactMethod, enquiryStatus, listingStatus, mapVisibility, propertyType, transactionType } from "./db/schema";

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Please enter a contact number")
  .max(30, "That number looks too long")
  .refine((v) => /^[+()\d\s-]+$/.test(v) && v.replace(/\D/g, "").length >= 9 && v.replace(/\D/g, "").length <= 15, "Please enter a valid phone number");

const nameSchema = z.string().trim().min(2, "Please enter your name").max(80, "Please shorten your name");
const emailOptional = z.union([z.literal(""), z.email("Please enter a valid email address").max(120)]);

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const requiredConsent = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.literal(true, { error: "Please confirm you have read the privacy notice" }),
);

const enquiryBase = {
  name: nameSchema,
  phone: phoneSchema,
  email: emailOptional,
  preferredContact: z.enum(contactMethod.enumValues, { error: "Choose how we should contact you" }),
  message: trimmed(2000),
  privacy: requiredConsent,
  marketing: checkbox,
};

function emailRequiredForEmailContact<T extends { preferredContact: string; email: string }>(v: T, ctx: z.RefinementCtx) {
  if (v.preferredContact === "email" && !v.email) {
    ctx.addIssue({ code: "custom", path: ["email"], message: "Add an email address so we can reply by email" });
  }
}

export const propertyEnquirySchema = z
  .object({ ...enquiryBase, propertyId: z.uuid("Unknown property") })
  .superRefine(emailRequiredForEmailContact);

export const generalEnquirySchema = z
  .object({ ...enquiryBase, message: z.string().trim().min(5, "Please tell us how we can help").max(2000) })
  .superRefine(emailRequiredForEmailContact);

const optionalCount = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.coerce.number().int("Whole numbers only").min(0).max(50).nullable(),
);
const optionalArea = z.preprocess(
  (v) => (v === "" || v == null ? null : String(v).replace(/[\s,]/g, "")),
  z.coerce.number().int("Whole square metres only").min(1).max(10_000_000).nullable(),
);

export const VALUATION_PROPERTY_TYPES = ["House", "Apartment / flat", "Townhouse", "Cluster home", "Vacant land", "Commercial", "Other"] as const;

export const valuationSchema = z
  .object({
    ...enquiryBase,
    address: z.string().trim().min(3, "Please enter the property address or suburb").max(200),
    propertyType: z.enum(VALUATION_PROPERTY_TYPES, { error: "Choose a property type" }),
    bedrooms: optionalCount,
    bathrooms: optionalCount,
    size: optionalArea,
    condition: trimmed(1000),
  })
  .superRefine(emailRequiredForEmailContact);

// ───────────── Admin ─────────────

const money = z.preprocess(
  (v) => (v === "" || v == null ? null : String(v).replace(/[\sR,]/gi, "")),
  z.coerce.number().int("Whole rands only").min(0).max(2_000_000_000).nullable(),
);
const coord = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().min(min).max(max).nullable());
const optionalBaths = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.coerce
    .number()
    .min(0)
    .max(50)
    .refine((n) => Number.isInteger(n * 2), "Use whole or half numbers, e.g. 1.5")
    .nullable(),
);

export const propertyFormSchema = z
  .object({
    reference: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^(ERE-[A-Z0-9]{4,12})?$/, "Format: ERE- followed by 4–12 letters/numbers")
      .optional(),
    title: z.string().trim().min(5, "Add a descriptive title").max(120),
    description: trimmed(10_000),
    transactionType: z.enum(transactionType.enumValues),
    propertyType: z.enum(propertyType.enumValues),
    status: z.enum(listingStatus.enumValues),
    price: money,
    bedrooms: optionalCount,
    bathrooms: optionalBaths,
    parking: optionalCount,
    floorArea: optionalArea,
    landArea: optionalArea,
    levies: money,
    ratesAndTaxes: money,
    suburb: z.string().trim().min(2, "Suburb is required").max(80),
    city: z.string().trim().min(2).max(80),
    streetAddress: trimmed(200),
    latitude: coord(-90, 90),
    longitude: coord(-180, 180),
    mapVisibility: z.enum(mapVisibility.enumValues),
    features: z.preprocess(
      (v) =>
        String(v ?? "")
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
      z.array(z.string().max(60, "Keep each feature under 60 characters")).max(40),
    ),
    featured: checkbox,
    agentId: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable()),
  })
  .superRefine((v, ctx) => {
    if (v.mapVisibility === "exact" && !v.streetAddress && (v.latitude == null || v.longitude == null)) {
      ctx.addIssue({ code: "custom", path: ["streetAddress"], message: "Exact map location needs a street address or coordinates" });
    }
    if ((v.latitude == null) !== (v.longitude == null)) {
      ctx.addIssue({ code: "custom", path: ["longitude"], message: "Enter both latitude and longitude, or neither" });
    }
    if (v.status !== "draft" && v.status !== "archived" && v.description.length < 30) {
      ctx.addIssue({ code: "custom", path: ["description"], message: "Add a description of at least 30 characters before publishing" });
    }
  });

export const enquiryUpdateSchema = z.object({
  status: z.enum(enquiryStatus.enumValues),
  assignedTo: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable()),
  followUpAt: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.date().nullable(),
  ),
});

export const noteSchema = z.object({ body: z.string().trim().min(1, "Write a note first").max(4000) });

export const loginSchema = z.object({
  email: z.email("Enter your email address").max(120).transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Enter your password").max(256),
});

export const testimonialSchema = z
  .object({
    quote: z.string().trim().min(10).max(1200),
    name: z.string().trim().min(2).max(80),
    context: trimmed(120),
    consentConfirmed: checkbox,
    published: checkbox,
    sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
  })
  .refine((v) => !v.published || v.consentConfirmed, { path: ["published"], message: "Confirm the client's written consent before publishing" });

export const agentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: trimmed(80),
  phone: z.union([z.literal(""), phoneSchema]),
  email: emailOptional,
  active: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(999).catch(0),
});

export type FieldErrors = Record<string, string>;

export function fieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}
