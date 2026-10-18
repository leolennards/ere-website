import "server-only";
import { SITE_URL } from "@/config/business";
import { ENQUIRY_TYPE_LABELS } from "@/lib/listing-options";
import type { EnquiryType } from "@/lib/db/schema";

/** True when Resend + sender + recipient are all configured. */
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.NOTIFY_EMAIL_TO);
}

async function sendEmail(to: string, subject: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

/**
 * Notifies the business of a new enquiry. Deliberately excludes the visitor's
 * phone, email and message: those stay inside the secured admin dashboard.
 */
export async function notifyNewEnquiry(e: { id: string; reference: string; type: EnquiryType; propertyReference: string | null }) {
  if (!emailConfigured()) return;
  const lines = [
    `A new ${ENQUIRY_TYPE_LABELS[e.type].toLowerCase()} was received on the ERE website.`,
    "",
    `Reference: ${e.reference}`,
    e.propertyReference ? `Property: ${e.propertyReference}` : null,
    "",
    `View it in the dashboard: ${SITE_URL}/admin/enquiries/${e.id}`,
  ].filter((l) => l !== null);
  try {
    await sendEmail(process.env.NOTIFY_EMAIL_TO!, `New ${ENQUIRY_TYPE_LABELS[e.type]} — ${e.reference}`, lines.join("\n"));
  } catch (err) {
    // The enquiry is already stored; a failed notification must not fail the submission.
    console.error("[email] notification failed for", e.reference, err instanceof Error ? err.message : err);
  }
}
