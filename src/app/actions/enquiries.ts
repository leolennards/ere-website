"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import type { z } from "zod";
import { createEnquiry, type NewEnquiryInput } from "@/lib/data/enquiries";
import { getDb } from "@/lib/db";
import { formValues, type FormState } from "@/lib/form-state";
import { clientIpFrom, hashIdentifier, hitRateLimit } from "@/lib/rate-limit";
import { notifyNewEnquiry } from "@/lib/server/email";
import { fieldErrors, generalEnquirySchema, propertyEnquirySchema, valuationSchema } from "@/lib/validation";
import { unstable_rethrow } from "next/navigation";

const HONEYPOT = "ere_website_url";
const MIN_FILL_MS = 2500;

async function spamCheck(fd: FormData, scope: string): Promise<string | null> {
  // Hidden field that people never see; automated scripts tend to fill every input.
  if (String(fd.get(HONEYPOT) ?? "") !== "") return "We couldn't send your enquiry. Please call or WhatsApp us instead.";
  const started = Number(fd.get("startedAt") ?? 0);
  if (started && Date.now() - started < MIN_FILL_MS) return "That was very quick — please check your details and submit again.";
  const ip = clientIpFrom(await headers());
  const db = getDb();
  const [perForm, perDay] = await Promise.all([
    hitRateLimit(db, `enquiry:${scope}:${hashIdentifier(ip)}`, 5, 10 * 60),
    hitRateLimit(db, `enquiry:all:${hashIdentifier(ip)}`, 30, 24 * 60 * 60),
  ]);
  if (!perForm.allowed || !perDay.allowed) return "You've sent several enquiries in a short time. Please wait a few minutes, or call or WhatsApp us directly.";
  return null;
}

async function submit<S extends z.ZodType>(fd: FormData, scope: string, schema: S, toInput: (v: z.infer<S>) => NewEnquiryInput): Promise<FormState> {
  const values = formValues(fd, [HONEYPOT, "startedAt"]);
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values, at: Date.now() };
  }
  try {
    const blocked = await spamCheck(fd, scope);
    if (blocked) return { status: "error", message: blocked, values, at: Date.now() };
    const created = await createEnquiry(getDb(), toInput(parsed.data));
    after(() => notifyNewEnquiry(created));
    return { status: "success", reference: created.reference, at: Date.now() };
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[enquiry:${scope}] failed:`, err instanceof Error ? err.message : err);
    return {
      status: "error",
      message: "Sorry, something went wrong and your enquiry was not sent. Please try again, or call or WhatsApp us.",
      values,
      at: Date.now(),
    };
  }
}

export async function submitPropertyEnquiry(_prev: FormState, fd: FormData): Promise<FormState> {
  return submit(fd, "property", propertyEnquirySchema, (v) => ({
    type: "property",
    propertyId: v.propertyId,
    name: v.name,
    phone: v.phone,
    email: v.email,
    preferredContact: v.preferredContact,
    message: v.message,
    marketingConsent: v.marketing,
  }));
}

export async function submitGeneralEnquiry(_prev: FormState, fd: FormData): Promise<FormState> {
  const topic = String(fd.get("topic") ?? "").slice(0, 40);
  return submit(fd, "general", generalEnquirySchema, (v) => ({
    type: "general",
    name: v.name,
    phone: v.phone,
    email: v.email,
    preferredContact: v.preferredContact,
    message: v.message,
    details: topic ? { topic } : null,
    marketingConsent: v.marketing,
  }));
}

export async function submitValuationRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  return submit(fd, "valuation", valuationSchema, (v) => ({
    type: "valuation",
    name: v.name,
    phone: v.phone,
    email: v.email,
    preferredContact: v.preferredContact,
    message: v.message,
    details: {
      address: v.address,
      propertyType: v.propertyType,
      bedrooms: v.bedrooms,
      bathrooms: v.bathrooms,
      sizeM2: v.size,
      condition: v.condition || null,
    },
    marketingConsent: v.marketing,
  }));
}
