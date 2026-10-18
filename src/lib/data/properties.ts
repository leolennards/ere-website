import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db";
import { agents, properties, propertyImages, type ListingStatus, type Property, type PropertyImage } from "../db/schema";
import { newPropertyReference, propertySlug, referenceFromSlug } from "../ids";
import { PAGE_SIZE, type SearchFilters } from "../search-filters";

export type PublicStatus = "available" | "under_offer" | "sold" | "let";

export interface ImageDTO {
  id: string;
  urls: Record<string, string>;
  width: number;
  height: number;
  alt: string;
}

export interface PropertyCardDTO {
  id: string;
  slug: string;
  reference: string;
  title: string;
  transactionType: Property["transactionType"];
  propertyType: Property["propertyType"];
  status: Property["status"];
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  floorArea: number | null;
  landArea: number | null;
  suburb: string;
  city: string;
  featured: boolean;
  isDemo: boolean;
  cover: ImageDTO | null;
}

export interface MapInfo {
  mode: "exact" | "approximate";
  query: string;
  zoom: number;
}

export interface PropertyDetailDTO extends PropertyCardDTO {
  description: string;
  features: string[];
  levies: number | null;
  ratesAndTaxes: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
  images: ImageDTO[];
  agent: { name: string; role: string; phone: string; email: string } | null;
  map: MapInfo | null;
}

const cardColumns = {
  id: properties.id,
  slug: properties.slug,
  reference: properties.reference,
  title: properties.title,
  transactionType: properties.transactionType,
  propertyType: properties.propertyType,
  status: properties.status,
  price: properties.price,
  bedrooms: properties.bedrooms,
  bathrooms: properties.bathrooms,
  parking: properties.parking,
  floorArea: properties.floorArea,
  landArea: properties.landArea,
  suburb: properties.suburb,
  city: properties.city,
  featured: properties.featured,
  isDemo: properties.isDemo,
};

function toImageDTO(i: PropertyImage): ImageDTO {
  return { id: i.id, urls: i.urls, width: i.width, height: i.height, alt: i.alt };
}

async function attachCovers<T extends { id: string }>(db: Db, rows: T[]): Promise<(T & { cover: ImageDTO | null })[]> {
  if (!rows.length) return [];
  const covers = await db
    .selectDistinctOn([propertyImages.propertyId])
    .from(propertyImages)
    .where(inArray(propertyImages.propertyId, rows.map((r) => r.id)))
    .orderBy(propertyImages.propertyId, asc(propertyImages.sortOrder), asc(propertyImages.createdAt));
  const byId = new Map(covers.map((c) => [c.propertyId, toImageDTO(c)]));
  return rows.map((r) => ({ ...r, cover: byId.get(r.id) ?? null }));
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Map location that is safe to expose, honouring the owner's privacy choice. */
export function publicMapInfo(p: Pick<Property, "mapVisibility" | "streetAddress" | "suburb" | "city" | "latitude" | "longitude">): MapInfo | null {
  if (p.mapVisibility === "hidden") return null;
  if (p.mapVisibility === "exact") {
    const query =
      p.latitude != null && p.longitude != null
        ? `${p.latitude},${p.longitude}`
        : [p.streetAddress, p.suburb, p.city, "South Africa"].filter(Boolean).join(", ");
    return { mode: "exact", query, zoom: 16 };
  }
  return { mode: "approximate", query: `${p.suburb}, ${p.city}, South Africa`, zoom: 14 };
}

export async function searchPublicProperties(
  db: Db,
  opts: { deal: "sale" | "rent"; filters: SearchFilters; statuses: PublicStatus[] },
) {
  const f = opts.filters;
  const where: SQL[] = [eq(properties.transactionType, opts.deal), inArray(properties.status, opts.statuses)];
  if (f.q) {
    const like = `%${escapeLike(f.q)}%`;
    where.push(or(ilike(properties.suburb, like), ilike(properties.city, like), ilike(properties.title, like), ilike(properties.reference, like))!);
  }
  if (f.type) where.push(eq(properties.propertyType, f.type));
  if (f.minPrice != null) where.push(gte(properties.price, f.minPrice));
  if (f.maxPrice != null) where.push(lte(properties.price, f.maxPrice));
  if (f.beds != null) where.push(gte(properties.bedrooms, f.beds));
  if (f.baths != null) where.push(gte(properties.bathrooms, f.baths));
  if (f.parking != null) where.push(gte(properties.parking, f.parking));

  const cond = and(...where);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(properties).where(cond);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, f.page ?? 1), pageCount);

  const newest = desc(sql`coalesce(${properties.publishedAt}, ${properties.createdAt})`);
  const order =
    f.sort === "price-asc"
      ? [sql`${properties.price} asc nulls last`, newest]
      : f.sort === "price-desc"
        ? [sql`${properties.price} desc nulls last`, newest]
        : [newest];
  // Available listings first so sold/let (when shown) never bury live stock.
  const statusRank = sql`case when ${properties.status} = 'available' then 0 when ${properties.status} = 'under_offer' then 1 else 2 end`;

  const rows = await db
    .select(cardColumns)
    .from(properties)
    .where(cond)
    .orderBy(statusRank, ...order, asc(properties.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { items: await attachCovers(db, rows), total, page, pageCount };
}

export async function getFeaturedProperties(db: Db, statuses: PublicStatus[], limit = 5) {
  const rows = await db
    .select(cardColumns)
    .from(properties)
    .where(and(eq(properties.featured, true), inArray(properties.status, statuses.filter((s) => s === "available" || s === "under_offer"))))
    .orderBy(desc(sql`coalesce(${properties.publishedAt}, ${properties.createdAt})`))
    .limit(limit);
  return attachCovers(db, rows);
}

export async function getRecentlySold(db: Db, statuses: PublicStatus[], limit = 4) {
  const closed = statuses.filter((s) => s === "sold" || s === "let");
  if (!closed.length) return [];
  const rows = await db
    .select(cardColumns)
    .from(properties)
    .where(inArray(properties.status, closed))
    .orderBy(desc(properties.updatedAt))
    .limit(limit);
  return attachCovers(db, rows);
}

export async function countPublicByDeal(db: Db, statuses: PublicStatus[]) {
  const rows = await db
    .select({ deal: properties.transactionType, n: sql<number>`count(*)::int` })
    .from(properties)
    .where(inArray(properties.status, statuses))
    .groupBy(properties.transactionType);
  return { sale: rows.find((r) => r.deal === "sale")?.n ?? 0, rent: rows.find((r) => r.deal === "rent")?.n ?? 0 };
}

export async function getPublicSuburbs(db: Db, statuses: PublicStatus[]) {
  const rows = await db
    .selectDistinct({ suburb: properties.suburb })
    .from(properties)
    .where(inArray(properties.status, statuses))
    .orderBy(asc(properties.suburb));
  return rows.map((r) => r.suburb);
}

type SlugLookup = { kind: "found"; property: PropertyDetailDTO } | { kind: "redirect"; slug: string } | { kind: "missing" };

export async function getPublicPropertyBySlug(db: Db, slug: string, statuses: PublicStatus[]): Promise<SlugLookup> {
  const [row] = await db.select().from(properties).where(and(eq(properties.slug, slug), inArray(properties.status, statuses)));
  if (row) return { kind: "found", property: await toDetail(db, row) };
  const ref = referenceFromSlug(slug);
  if (ref) {
    const [moved] = await db
      .select({ slug: properties.slug })
      .from(properties)
      .where(and(eq(properties.reference, ref), inArray(properties.status, statuses)));
    if (moved && moved.slug !== slug) return { kind: "redirect", slug: moved.slug };
  }
  return { kind: "missing" };
}

/** Admin preview: any status. Callers must have verified admin access. */
export async function getPropertyDetailById(db: Db, id: string) {
  const [row] = await db.select().from(properties).where(eq(properties.id, id));
  return row ? toDetail(db, row) : null;
}

async function toDetail(db: Db, row: Property): Promise<PropertyDetailDTO> {
  const images = await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, row.id))
    .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.createdAt));
  let agent: PropertyDetailDTO["agent"] = null;
  if (row.agentId) {
    const [a] = await db.select().from(agents).where(and(eq(agents.id, row.agentId), eq(agents.active, true)));
    if (a) agent = { name: a.name, role: a.role, phone: a.phone, email: a.email };
  }
  const imgs = images.map(toImageDTO);
  return {
    id: row.id,
    slug: row.slug,
    reference: row.reference,
    title: row.title,
    transactionType: row.transactionType,
    propertyType: row.propertyType,
    status: row.status,
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    floorArea: row.floorArea,
    landArea: row.landArea,
    suburb: row.suburb,
    city: row.city,
    featured: row.featured,
    isDemo: row.isDemo,
    cover: imgs[0] ?? null,
    description: row.description,
    features: row.features,
    levies: row.levies,
    ratesAndTaxes: row.ratesAndTaxes,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    images: imgs,
    agent,
    map: publicMapInfo(row),
  };
}

export async function getRelatedProperties(db: Db, p: PropertyDetailDTO, statuses: PublicStatus[], limit = 3) {
  const rows = await db
    .select(cardColumns)
    .from(properties)
    .where(
      and(
        ne(properties.id, p.id),
        eq(properties.transactionType, p.transactionType),
        inArray(properties.status, statuses.filter((s) => s === "available" || s === "under_offer")),
        or(eq(properties.suburb, p.suburb), eq(properties.propertyType, p.propertyType)),
      ),
    )
    .orderBy(desc(sql`(${properties.suburb} = ${p.suburb})`), desc(sql`coalesce(${properties.publishedAt}, ${properties.createdAt})`))
    .limit(limit);
  return attachCovers(db, rows);
}

export async function listSitemapProperties(db: Db, statuses: PublicStatus[]) {
  return db.select({ slug: properties.slug, updatedAt: properties.updatedAt, isDemo: properties.isDemo }).from(properties).where(inArray(properties.status, statuses));
}

// ───────────────────────────── Admin ─────────────────────────────

export interface PropertyInput {
  reference?: string;
  title: string;
  description: string;
  transactionType: Property["transactionType"];
  propertyType: Property["propertyType"];
  status: ListingStatus;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  floorArea: number | null;
  landArea: number | null;
  levies: number | null;
  ratesAndTaxes: number | null;
  suburb: string;
  city: string;
  streetAddress: string;
  latitude: number | null;
  longitude: number | null;
  mapVisibility: Property["mapVisibility"];
  features: string[];
  featured: boolean;
  agentId: string | null;
}

export class DuplicateReferenceError extends Error {}

function isUniqueViolation(err: unknown, constraint?: string) {
  const e = err as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
  const code = e.code ?? e.cause?.code;
  const c = e.constraint ?? e.cause?.constraint;
  return code === "23505" && (!constraint || c === constraint);
}

export async function createProperty(db: Db, input: PropertyInput, opts: { isDemo?: boolean } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = input.reference?.trim().toUpperCase() || newPropertyReference();
    try {
      const [row] = await db
        .insert(properties)
        .values({
          ...input,
          reference,
          slug: propertySlug(input.title, input.suburb, reference),
          isDemo: opts.isDemo ?? false,
          publishedAt: input.status === "draft" ? null : new Date(),
        })
        .returning();
      return row;
    } catch (err) {
      if (isUniqueViolation(err)) {
        if (input.reference) throw new DuplicateReferenceError(`Reference ${reference} is already in use.`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Could not allocate a unique reference.");
}

export async function updateProperty(db: Db, id: string, input: PropertyInput) {
  const [current] = await db.select().from(properties).where(eq(properties.id, id));
  if (!current) return null;
  const reference = input.reference?.trim().toUpperCase() || current.reference;
  const slugChanged = current.title !== input.title || current.suburb !== input.suburb || current.reference !== reference;
  try {
    const [row] = await db
      .update(properties)
      .set({
        ...input,
        reference,
        slug: slugChanged ? propertySlug(input.title, input.suburb, reference) : current.slug,
        publishedAt: current.publishedAt ?? (input.status === "draft" ? null : new Date()),
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();
    return row;
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateReferenceError(`Reference ${reference} is already in use.`);
    throw err;
  }
}

export async function setPropertyStatus(db: Db, id: string, status: ListingStatus) {
  const [current] = await db.select({ publishedAt: properties.publishedAt }).from(properties).where(eq(properties.id, id));
  if (!current) return null;
  const [row] = await db
    .update(properties)
    .set({ status, updatedAt: new Date(), publishedAt: current.publishedAt ?? (status === "draft" ? null : new Date()) })
    .where(eq(properties.id, id))
    .returning();
  return row;
}

/** Deletes the property and its image rows; enquiries keep their snapshot. Returns storage keys to remove. */
export async function deleteProperty(db: Db, id: string) {
  const imgs = await db.select({ keys: propertyImages.storageKeys }).from(propertyImages).where(eq(propertyImages.propertyId, id));
  const [row] = await db.delete(properties).where(eq(properties.id, id)).returning({ id: properties.id, reference: properties.reference, title: properties.title });
  return row ? { ...row, storageKeys: imgs.flatMap((i) => i.keys) } : null;
}

export async function adminListProperties(
  db: Db,
  opts: { q?: string; status?: ListingStatus; deal?: "sale" | "rent"; page?: number; pageSize?: number },
) {
  const where: SQL[] = [];
  if (opts.q) {
    const like = `%${escapeLike(opts.q)}%`;
    where.push(or(ilike(properties.title, like), ilike(properties.reference, like), ilike(properties.suburb, like))!);
  }
  if (opts.status) where.push(eq(properties.status, opts.status));
  if (opts.deal) where.push(eq(properties.transactionType, opts.deal));
  const cond = where.length ? and(...where) : undefined;
  const size = opts.pageSize ?? 20;
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(properties).where(cond);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  const rows = await db
    .select({ ...cardColumns, updatedAt: properties.updatedAt })
    .from(properties)
    .where(cond)
    .orderBy(desc(properties.updatedAt))
    .limit(size)
    .offset((page - 1) * size);
  return { items: await attachCovers(db, rows), total, page, pageCount };
}

export async function getPropertyForEdit(db: Db, id: string) {
  const [row] = await db.select().from(properties).where(eq(properties.id, id));
  if (!row) return null;
  const images = await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, id))
    .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.createdAt));
  return { property: row, images };
}

export async function propertyCounts(db: Db) {
  const rows = await db.select({ status: properties.status, n: sql<number>`count(*)::int` }).from(properties).groupBy(properties.status);
  const by = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<ListingStatus, number>>;
  return {
    published: (by.available ?? 0) + (by.under_offer ?? 0),
    drafts: by.draft ?? 0,
    closed: (by.sold ?? 0) + (by.let ?? 0),
    archived: by.archived ?? 0,
    featured: (await db.select({ n: sql<number>`count(*)::int` }).from(properties).where(and(eq(properties.featured, true), inArray(properties.status, ["available", "under_offer"]))))[0].n,
  };
}

// ───────────────────────────── Images ─────────────────────────────

export const MAX_IMAGES_PER_PROPERTY = 40;

export async function countImages(db: Db, propertyId: string) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(propertyImages).where(eq(propertyImages.propertyId, propertyId));
  return n;
}

export async function addPropertyImage(
  db: Db,
  img: { propertyId: string; urls: Record<string, string>; storageKeys: string[]; width: number; height: number; alt: string },
) {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${propertyImages.sortOrder}) + 1, 0)::int` })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, img.propertyId));
  const [row] = await db.insert(propertyImages).values({ ...img, sortOrder: next }).returning();
  return row;
}

export async function updateImageAlt(db: Db, propertyId: string, imageId: string, alt: string) {
  await db.update(propertyImages).set({ alt }).where(and(eq(propertyImages.id, imageId), eq(propertyImages.propertyId, propertyId)));
}

/** Rewrites sort orders 0..n in the given sequence (ids not belonging to the property are ignored). */
export async function reorderImages(db: Db, propertyId: string, orderedIds: string[]) {
  const existing = await db
    .select({ id: propertyImages.id })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.createdAt));
  const known = new Set(existing.map((e) => e.id));
  const order = [...orderedIds.filter((id) => known.has(id)), ...existing.map((e) => e.id).filter((id) => !orderedIds.includes(id))];
  await db.transaction(async (tx) => {
    for (const [i, id] of order.entries()) {
      await tx.update(propertyImages).set({ sortOrder: i }).where(eq(propertyImages.id, id));
    }
  });
  return order;
}

export async function moveImage(db: Db, propertyId: string, imageId: string, direction: "up" | "down" | "first") {
  const existing = await db
    .select({ id: propertyImages.id })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.createdAt));
  const ids = existing.map((e) => e.id);
  const i = ids.indexOf(imageId);
  if (i < 0) return;
  ids.splice(i, 1);
  const to = direction === "first" ? 0 : direction === "up" ? Math.max(0, i - 1) : Math.min(ids.length, i + 1);
  ids.splice(to, 0, imageId);
  await reorderImages(db, propertyId, ids);
}

export async function deleteImage(db: Db, propertyId: string, imageId: string) {
  const [row] = await db
    .delete(propertyImages)
    .where(and(eq(propertyImages.id, imageId), eq(propertyImages.propertyId, propertyId)))
    .returning({ keys: propertyImages.storageKeys });
  return row?.keys ?? [];
}

export async function listActiveAgents(db: Db) {
  return db.select().from(agents).where(eq(agents.active, true)).orderBy(asc(agents.sortOrder), asc(agents.name));
}

export async function demoPropertyCount(db: Db) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(properties).where(eq(properties.isDemo, true));
  return n;
}

