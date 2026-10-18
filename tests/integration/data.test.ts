import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createEnquiry, deleteEnquiry, enquiryCounts, getEnquiry, listEnquiries } from "@/lib/data/enquiries";
import {
  addPropertyImage,
  createProperty,
  deleteProperty,
  getFeaturedProperties,
  getPublicPropertyBySlug,
  moveImage,
  propertyCounts,
  publicMapInfo,
  searchPublicProperties,
  setPropertyStatus,
  updateProperty,
  type PropertyInput,
} from "@/lib/data/properties";
import type { Db } from "@/lib/db";
import { enquiries, propertyImages } from "@/lib/db/schema";
import { hitRateLimit } from "@/lib/rate-limit";
import { DEFAULT_SETTINGS, loadSettings, publicStatuses, saveSettings } from "@/lib/settings";
import { createTestDb } from "../helpers/db";

let db: Db;
let close: () => Promise<void>;

const base: PropertyInput = {
  title: "Test home",
  description: "A thoroughly described test property for integration tests.",
  transactionType: "sale",
  propertyType: "house",
  status: "available",
  price: 1_500_000,
  bedrooms: 3,
  bathrooms: 2,
  parking: 1,
  floorArea: null,
  landArea: null,
  levies: null,
  ratesAndTaxes: null,
  suburb: "Parow",
  city: "Cape Town",
  streetAddress: "12 Private Road",
  latitude: null,
  longitude: null,
  mapVisibility: "approximate",
  features: ["Garden"],
  featured: false,
  agentId: null,
};
const statuses = publicStatuses(DEFAULT_SETTINGS.visibility);

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await createProperty(db, { ...base, title: "Draft cottage", status: "draft", featured: true });
  await createProperty(db, { ...base, title: "Archived flat", status: "archived" });
  await createProperty(db, { ...base, title: "Sold house", status: "sold" });
  await createProperty(db, { ...base, title: "Bellville apartment", suburb: "Bellville", propertyType: "apartment", price: 950_000, bedrooms: 2, featured: true });
  await createProperty(db, { ...base, title: "Parow family home", price: 2_100_000, bedrooms: 4 });
  await createProperty(db, { ...base, title: "Price on application home", price: null, bedrooms: 5 });
  await createProperty(db, { ...base, title: "Rental flat", transactionType: "rent", price: 9_500, propertyType: "apartment" });
});
afterAll(async () => close?.());

describe("public property visibility", () => {
  it("never returns draft or archived listings, and hides sold by default", async () => {
    const r = await searchPublicProperties(db, { deal: "sale", filters: {}, statuses });
    const titles = r.items.map((i) => i.title);
    expect(titles).not.toContain("Draft cottage");
    expect(titles).not.toContain("Archived flat");
    expect(titles).not.toContain("Sold house");
    expect(r.total).toBe(3);
  });

  it("shows sold listings only when the owner enables them", async () => {
    const r = await searchPublicProperties(db, { deal: "sale", filters: {}, statuses: publicStatuses({ ...DEFAULT_SETTINGS.visibility, showSold: true }) });
    expect(r.items.map((i) => i.title)).toContain("Sold house");
    // Available stock is listed before sold stock.
    expect(r.items.at(-1)?.title).toBe("Sold house");
  });

  it("only features published listings", async () => {
    const featured = await getFeaturedProperties(db, statuses);
    expect(featured.map((f) => f.title)).toEqual(["Bellville apartment"]);
  });

  it("does not resolve a draft by slug", async () => {
    const draft = await createProperty(db, { ...base, title: "Secret draft", status: "draft" });
    expect((await getPublicPropertyBySlug(db, draft.slug, statuses)).kind).toBe("missing");
  });
});

describe("search and filters", () => {
  it("combines suburb, type, price and bedroom filters", async () => {
    const r = await searchPublicProperties(db, { deal: "sale", filters: { q: "parow", minPrice: 1_000_000, beds: 4 }, statuses });
    expect(r.items.map((i) => i.title)).toEqual(["Parow family home"]);
    const apt = await searchPublicProperties(db, { deal: "sale", filters: { type: "apartment" }, statuses });
    expect(apt.items.map((i) => i.title)).toEqual(["Bellville apartment"]);
  });

  it("treats LIKE wildcards in the search box literally", async () => {
    const r = await searchPublicProperties(db, { deal: "sale", filters: { q: "%" }, statuses });
    expect(r.total).toBe(0);
  });

  it("sorts by price with price-on-application last", async () => {
    const asc = await searchPublicProperties(db, { deal: "sale", filters: { sort: "price-asc" }, statuses });
    expect(asc.items.map((i) => i.price)).toEqual([950_000, 2_100_000, null]);
    const desc = await searchPublicProperties(db, { deal: "sale", filters: { sort: "price-desc" }, statuses });
    expect(desc.items.map((i) => i.price)).toEqual([2_100_000, 950_000, null]);
  });

  it("keeps rentals separate from sales", async () => {
    const r = await searchPublicProperties(db, { deal: "rent", filters: {}, statuses });
    expect(r.items.map((i) => i.title)).toEqual(["Rental flat"]);
  });

  it("clamps out-of-range pages", async () => {
    const r = await searchPublicProperties(db, { deal: "sale", filters: { page: 99 }, statuses });
    expect(r.page).toBe(1);
    expect(r.items.length).toBe(3);
  });
});

describe("property lifecycle", () => {
  it("sets publishedAt on first publish and keeps it afterwards", async () => {
    const p = await createProperty(db, { ...base, title: "Lifecycle", status: "draft" });
    expect(p.publishedAt).toBeNull();
    const pub = await setPropertyStatus(db, p.id, "available");
    expect(pub?.publishedAt).toBeInstanceOf(Date);
    const sold = await setPropertyStatus(db, p.id, "sold");
    expect(sold?.publishedAt?.getTime()).toBe(pub?.publishedAt?.getTime());
  });

  it("redirects an old slug to the new one after a title change", async () => {
    const p = await createProperty(db, { ...base, title: "Original title" });
    const updated = await updateProperty(db, p.id, { ...base, title: "Renamed title" });
    expect(updated?.slug).not.toBe(p.slug);
    const lookup = await getPublicPropertyBySlug(db, p.slug, statuses);
    expect(lookup).toEqual({ kind: "redirect", slug: updated?.slug });
  });

  it("keeps enquiries (with a snapshot) when a property is deleted", async () => {
    const p = await createProperty(db, { ...base, title: "To be deleted" });
    await addPropertyImage(db, { propertyId: p.id, urls: { "960": "/x.webp" }, storageKeys: ["a", "b"], width: 960, height: 640, alt: "" });
    const e = await createEnquiry(db, { type: "property", propertyId: p.id, name: "Thandi", phone: "0821234567", email: "", preferredContact: "phone", message: "", marketingConsent: false });
    expect(e.propertyReference).toBe(p.reference);
    const removed = await deleteProperty(db, p.id);
    expect(removed?.storageKeys).toEqual(["a", "b"]);
    const [kept] = await db.select().from(enquiries).where(eq(enquiries.id, e.id));
    expect(kept.propertyId).toBeNull();
    expect(kept.propertyTitle).toBe("To be deleted");
  });

  it("reorders images so the chosen one becomes the cover", async () => {
    const p = await createProperty(db, { ...base, title: "Gallery" });
    const a = await addPropertyImage(db, { propertyId: p.id, urls: {}, storageKeys: [], width: 1, height: 1, alt: "a" });
    const b = await addPropertyImage(db, { propertyId: p.id, urls: {}, storageKeys: [], width: 1, height: 1, alt: "b" });
    const c = await addPropertyImage(db, { propertyId: p.id, urls: {}, storageKeys: [], width: 1, height: 1, alt: "c" });
    await moveImage(db, p.id, c.id, "first");
    const rows = await db.select().from(propertyImages).where(eq(propertyImages.propertyId, p.id)).orderBy(propertyImages.sortOrder);
    expect(rows.map((r) => r.alt)).toEqual(["c", "a", "b"]);
    await moveImage(db, p.id, a.id, "down");
    const rows2 = await db.select().from(propertyImages).where(eq(propertyImages.propertyId, p.id)).orderBy(propertyImages.sortOrder);
    expect(rows2.map((r) => r.id)).toEqual([c.id, b.id, a.id]);
  });

  it("counts listings for the dashboard from real data", async () => {
    const c = await propertyCounts(db);
    expect(c.drafts).toBeGreaterThanOrEqual(2);
    expect(c.archived).toBe(1);
  });
});

describe("map privacy", () => {
  const p = { streetAddress: "12 Private Road", suburb: "Parow", city: "Cape Town", latitude: -33.9, longitude: 18.59 };
  it("never exposes the street address or coordinates for approximate locations", () => {
    const m = publicMapInfo({ ...p, mapVisibility: "approximate" });
    expect(m?.query).toBe("Parow, Cape Town, South Africa");
    expect(JSON.stringify(m)).not.toContain("Private");
    expect(JSON.stringify(m)).not.toContain("18.59");
  });
  it("hides the map entirely when requested", () => {
    expect(publicMapInfo({ ...p, mapVisibility: "hidden" })).toBeNull();
  });
  it("uses coordinates for exact locations when available", () => {
    expect(publicMapInfo({ ...p, mapVisibility: "exact" })?.query).toBe("-33.9,18.59");
  });
});

describe("enquiries", () => {
  it("does not link enquiries to draft listings", async () => {
    const draft = await createProperty(db, { ...base, title: "Hidden draft", status: "draft" });
    const e = await createEnquiry(db, { type: "property", propertyId: draft.id, name: "Sam", phone: "0821112222", email: "", preferredContact: "phone", message: "", marketingConsent: false });
    const full = await getEnquiry(db, e.id);
    expect(full?.enquiry.propertyId).toBeNull();
    expect(full?.enquiry.propertyTitle).toBeNull();
  });

  it("records consent metadata and unique references", async () => {
    const a = await createEnquiry(db, { type: "valuation", name: "Lee", phone: "0821112223", email: "lee@example.com", preferredContact: "email", message: "", details: { address: "Parow" }, marketingConsent: false });
    const full = await getEnquiry(db, a.id);
    expect(full?.enquiry.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(full?.enquiry.privacyNoticeVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(full?.enquiry.marketingConsent).toBe(false);
    expect(a.reference).toMatch(/^ENQ-/);
  });

  it("filters, counts and deletes enquiries", async () => {
    const list = await listEnquiries(db, { type: "valuation" });
    expect(list.items.every((i) => i.type === "valuation")).toBe(true);
    const counts = await enquiryCounts(db);
    expect(counts.total).toBeGreaterThanOrEqual(3);
    expect(counts.unread).toBe(counts.total);
    const byRef = await listEnquiries(db, { q: list.items[0].reference });
    expect(byRef.total).toBe(1);
    expect(await deleteEnquiry(db, list.items[0].id)).toEqual({ reference: list.items[0].reference });
  });
});

describe("settings", () => {
  it("falls back to defaults and persists validated groups", async () => {
    const s = await loadSettings(db);
    expect(s.business.phoneE164).toBe("+27824741178");
    await saveSettings(db, "visibility", { showUnderOffer: false, showSold: true, showLet: false }, null);
    expect((await loadSettings(db)).visibility.showSold).toBe(true);
    await expect(saveSettings(db, "social", { facebook: "https://evil.example.com", instagram: "", linkedin: "" }, null)).rejects.toThrow();
  });
});

describe("rate limiting", () => {
  it("allows up to the limit within a window", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await hitRateLimit(db, "test:key", 3, 60)).allowed);
    expect(results).toEqual([true, true, true, false]);
  });
});
