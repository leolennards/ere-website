import { and, asc, desc, eq, gte, ilike, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db";
import {
  admins,
  enquiries,
  enquiryNotes,
  properties,
  type ContactMethod,
  type EnquiryStatus,
  type EnquiryType,
} from "../db/schema";
import { newEnquiryReference } from "../ids";
import { PRIVACY_NOTICE_VERSION } from "@/config/business";

export interface NewEnquiryInput {
  type: EnquiryType;
  propertyId?: string | null;
  name: string;
  phone: string;
  email: string;
  preferredContact: ContactMethod;
  message: string;
  details?: Record<string, string | number | null> | null;
  marketingConsent: boolean;
}

export async function createEnquiry(db: Db, input: NewEnquiryInput) {
  let propertyReference: string | null = null;
  let propertyTitle: string | null = null;
  let propertyId: string | null = null;
  if (input.propertyId) {
    // Only link to listings that are actually public; never trust a posted id blindly.
    const [p] = await db
      .select({ id: properties.id, reference: properties.reference, title: properties.title, status: properties.status })
      .from(properties)
      .where(eq(properties.id, input.propertyId));
    if (p && p.status !== "draft" && p.status !== "archived") {
      propertyId = p.id;
      propertyReference = p.reference;
      propertyTitle = p.title;
    }
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = newEnquiryReference();
    try {
      const [row] = await db
        .insert(enquiries)
        .values({
          reference,
          type: input.type,
          propertyId,
          propertyReference,
          propertyTitle,
          name: input.name,
          phone: input.phone,
          email: input.email,
          preferredContact: input.preferredContact,
          message: input.message,
          details: input.details ?? null,
          privacyAcceptedAt: new Date(),
          privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
          marketingConsent: input.marketingConsent,
        })
        .returning({ id: enquiries.id, reference: enquiries.reference, type: enquiries.type, propertyReference: enquiries.propertyReference });
      return row;
    } catch (err) {
      const code = (err as { code?: string; cause?: { code?: string } }).code ?? (err as { cause?: { code?: string } }).cause?.code;
      if (code === "23505") continue;
      throw err;
    }
  }
  throw new Error("Could not allocate an enquiry reference.");
}

export interface EnquiryListFilters {
  type?: EnquiryType;
  status?: EnquiryStatus;
  q?: string;
  from?: Date;
  to?: Date;
  unread?: boolean;
  page?: number;
}

function enquiryWhere(f: EnquiryListFilters) {
  const where: SQL[] = [];
  if (f.type) where.push(eq(enquiries.type, f.type));
  if (f.status) where.push(eq(enquiries.status, f.status));
  if (f.unread) where.push(isNull(enquiries.readAt));
  if (f.from) where.push(gte(enquiries.createdAt, f.from));
  if (f.to) where.push(lt(enquiries.createdAt, f.to));
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.push(
      or(
        ilike(enquiries.name, like),
        ilike(enquiries.reference, like),
        ilike(enquiries.phone, like),
        ilike(enquiries.email, like),
        ilike(enquiries.propertyReference, like),
      )!,
    );
  }
  return where.length ? and(...where) : undefined;
}

export async function listEnquiries(db: Db, f: EnquiryListFilters, pageSize = 25) {
  const cond = enquiryWhere(f);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(enquiries).where(cond);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, f.page ?? 1), pageCount);
  const items = await db
    .select({
      id: enquiries.id,
      reference: enquiries.reference,
      type: enquiries.type,
      status: enquiries.status,
      name: enquiries.name,
      phone: enquiries.phone,
      preferredContact: enquiries.preferredContact,
      propertyReference: enquiries.propertyReference,
      createdAt: enquiries.createdAt,
      readAt: enquiries.readAt,
      followUpAt: enquiries.followUpAt,
      assigneeName: admins.name,
    })
    .from(enquiries)
    .leftJoin(admins, eq(admins.id, enquiries.assignedTo))
    .where(cond)
    .orderBy(desc(enquiries.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { items, total, page, pageCount };
}

export async function exportEnquiries(db: Db, f: EnquiryListFilters) {
  return db
    .select({
      reference: enquiries.reference,
      createdAt: enquiries.createdAt,
      type: enquiries.type,
      status: enquiries.status,
      name: enquiries.name,
      phone: enquiries.phone,
      email: enquiries.email,
      preferredContact: enquiries.preferredContact,
      propertyReference: enquiries.propertyReference,
      message: enquiries.message,
      details: enquiries.details,
      marketingConsent: enquiries.marketingConsent,
    })
    .from(enquiries)
    .where(enquiryWhere(f))
    .orderBy(desc(enquiries.createdAt))
    .limit(10_000);
}

export async function getEnquiry(db: Db, id: string) {
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id));
  if (!row) return null;
  const notes = await db.select().from(enquiryNotes).where(eq(enquiryNotes.enquiryId, id)).orderBy(asc(enquiryNotes.createdAt));
  let property: { id: string; slug: string; status: string } | null = null;
  if (row.propertyId) {
    const [p] = await db.select({ id: properties.id, slug: properties.slug, status: properties.status }).from(properties).where(eq(properties.id, row.propertyId));
    property = p ?? null;
  }
  return { enquiry: row, notes, property };
}

export async function markEnquiryRead(db: Db, id: string) {
  await db.update(enquiries).set({ readAt: new Date() }).where(and(eq(enquiries.id, id), isNull(enquiries.readAt)));
}

export async function updateEnquiry(
  db: Db,
  id: string,
  patch: { status: EnquiryStatus; assignedTo: string | null; followUpAt: Date | null },
) {
  const [row] = await db
    .update(enquiries)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(enquiries.id, id))
    .returning({ id: enquiries.id, reference: enquiries.reference });
  return row ?? null;
}

export async function addEnquiryNote(db: Db, enquiryId: string, author: { id: string; name: string }, body: string) {
  await db.insert(enquiryNotes).values({ enquiryId, authorId: author.id, authorName: author.name, body });
  await db.update(enquiries).set({ updatedAt: new Date() }).where(eq(enquiries.id, enquiryId));
}

export async function deleteEnquiry(db: Db, id: string) {
  const [row] = await db.delete(enquiries).where(eq(enquiries.id, id)).returning({ reference: enquiries.reference });
  return row ?? null;
}

export async function enquiryCounts(db: Db) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      new: sql<number>`count(*) filter (where ${enquiries.status} = 'new')::int`,
      unread: sql<number>`count(*) filter (where ${enquiries.readAt} is null)::int`,
      valuations: sql<number>`count(*) filter (where ${enquiries.type} = 'valuation' and ${enquiries.status} <> 'resolved')::int`,
      last30: sql<number>`count(*) filter (where ${enquiries.createdAt} > now() - interval '30 days')::int`,
      followUpsDue: sql<number>`count(*) filter (where ${enquiries.followUpAt} <= now() and ${enquiries.status} <> 'resolved')::int`,
    })
    .from(enquiries);
  return row;
}
