import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const transactionType = pgEnum("transaction_type", ["sale", "rent"]);
export const propertyType = pgEnum("property_type", [
  "house",
  "apartment",
  "townhouse",
  "cluster",
  "land",
  "commercial",
  "other",
]);
export const listingStatus = pgEnum("listing_status", [
  "draft",
  "available",
  "under_offer",
  "sold",
  "let",
  "archived",
]);
export const mapVisibility = pgEnum("map_visibility", ["exact", "approximate", "hidden"]);
export const enquiryType = pgEnum("enquiry_type", ["property", "valuation", "general"]);
export const enquiryStatus = pgEnum("enquiry_status", ["new", "contacted", "in_progress", "resolved"]);
export const contactMethod = pgEnum("contact_method", ["phone", "whatsapp", "email"]);
export const adminRole = pgEnum("admin_role", ["owner", "staff"]);
export const adminStatus = pgEnum("admin_status", ["active", "disabled"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRole("role").notNull().default("staff"),
  status: adminStatus("status").notNull().default("active"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the cookie token; the raw token is never stored.
    id: text("id").primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_admin_idx").on(t.adminId), index("sessions_expires_idx").on(t.expiresAt)],
);

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    transactionType: transactionType("transaction_type").notNull(),
    propertyType: propertyType("property_type").notNull(),
    status: listingStatus("status").notNull().default("draft"),
    // Whole rands. NULL = "Price on application". Rentals are per month.
    price: integer("price"),
    bedrooms: integer("bedrooms"),
    bathrooms: numeric("bathrooms", { precision: 3, scale: 1, mode: "number" }),
    parking: integer("parking"),
    floorArea: integer("floor_area"),
    landArea: integer("land_area"),
    levies: integer("levies"),
    ratesAndTaxes: integer("rates_and_taxes"),
    suburb: text("suburb").notNull(),
    city: text("city").notNull().default("Cape Town"),
    // Private: only exposed publicly when map_visibility = 'exact'.
    streetAddress: text("street_address").notNull().default(""),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    mapVisibility: mapVisibility("map_visibility").notNull().default("approximate"),
    features: text("features").array().notNull().default(sql`'{}'::text[]`),
    featured: boolean("featured").notNull().default(false),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    isDemo: boolean("is_demo").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("properties_public_idx").on(t.status, t.transactionType),
    index("properties_suburb_idx").on(t.suburb),
    index("properties_price_idx").on(t.price),
    index("properties_featured_idx").on(t.featured),
    check("properties_price_nonneg", sql`${t.price} IS NULL OR ${t.price} >= 0`),
    check("properties_bedrooms_range", sql`${t.bedrooms} IS NULL OR ${t.bedrooms} BETWEEN 0 AND 50`),
    check("properties_lat_range", sql`${t.latitude} IS NULL OR ${t.latitude} BETWEEN -90 AND 90`),
    check("properties_lng_range", sql`${t.longitude} IS NULL OR ${t.longitude} BETWEEN -180 AND 180`),
  ],
);

export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    // Variants: { "480": url, "960": url, "1600": url }
    urls: jsonb("urls").$type<Record<string, string>>().notNull(),
    storageKeys: text("storage_keys").array().notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    alt: text("alt").notNull().default(""),
    // The image with the lowest sort order is the cover image.
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("property_images_property_idx").on(t.propertyId, t.sortOrder)],
);

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    type: enquiryType("type").notNull(),
    status: enquiryStatus("status").notNull().default("new"),
    // Kept even if the property is deleted: snapshot fields preserve context.
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    propertyReference: text("property_reference"),
    propertyTitle: text("property_title"),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    preferredContact: contactMethod("preferred_contact").notNull().default("phone"),
    message: text("message").notNull().default(""),
    details: jsonb("details").$type<Record<string, string | number | null>>(),
    privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }).notNull(),
    privacyNoticeVersion: text("privacy_notice_version").notNull(),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    assignedTo: uuid("assigned_to").references(() => admins.id, { onDelete: "set null" }),
    followUpAt: timestamp("follow_up_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("enquiries_status_idx").on(t.status),
    index("enquiries_type_idx").on(t.type),
    index("enquiries_created_idx").on(t.createdAt),
  ],
);

export const enquiryNotes = pgTable(
  "enquiry_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enquiryId: uuid("enquiry_id")
      .notNull()
      .references(() => enquiries.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => admins.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("enquiry_notes_enquiry_idx").on(t.enquiryId)],
);

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quote: text("quote").notNull(),
    name: text("name").notNull(),
    context: text("context").notNull().default(""),
    consentConfirmed: boolean("consent_confirmed").notNull().default(false),
    published: boolean("published").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [check("testimonials_publish_requires_consent", sql`NOT ${t.published} OR ${t.consentConfirmed}`)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => admins.id, { onDelete: "set null" }),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    adminId: uuid("admin_id").references(() => admins.id, { onDelete: "set null" }),
    adminName: text("admin_name").notNull().default(""),
    action: text("action").notNull(),
    entity: text("entity").notNull().default(""),
    entityId: text("entity_id").notNull().default(""),
    summary: text("summary").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type ListingStatus = (typeof listingStatus.enumValues)[number];
export type TransactionType = (typeof transactionType.enumValues)[number];
export type PropertyType = (typeof propertyType.enumValues)[number];
export type EnquiryType = (typeof enquiryType.enumValues)[number];
export type EnquiryStatus = (typeof enquiryStatus.enumValues)[number];
export type ContactMethod = (typeof contactMethod.enumValues)[number];
export type AdminRole = (typeof adminRole.enumValues)[number];
