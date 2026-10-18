/**
 * LOCAL DEVELOPMENT ONLY. Seeds clearly-labelled demonstration listings so the
 * design and search can be exercised before real listings exist.
 *
 *   npm run db:seed-demo     # adds demo listings (is_demo = true)
 *   npm run db:clear-demo    # removes every demo listing and its images
 *
 * Demo listings show a "Demo listing" badge and banner and must never be
 * published on the live site. Photos are CC0 (StockSnap) — see docs.
 */
import "./_env";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import sharp from "sharp";
import { createPool, type Db } from "../src/lib/db";
import * as schema from "../src/lib/db/schema";
import { addPropertyImage, createProperty, type PropertyInput } from "../src/lib/data/properties";

const uploads = path.resolve(process.env.UPLOADS_DIR || ".data/uploads");
const DISCLAIMER = "DEMONSTRATION LISTING — this is sample content used to test the website. It is not a real property and is not for sale or to let.\n\n";

const base: Omit<PropertyInput, "title" | "transactionType" | "propertyType" | "price" | "suburb"> = {
  description: "",
  status: "available",
  bedrooms: null,
  bathrooms: null,
  parking: null,
  floorArea: null,
  landArea: null,
  levies: null,
  ratesAndTaxes: null,
  city: "Cape Town",
  streetAddress: "",
  latitude: null,
  longitude: null,
  mapVisibility: "approximate",
  features: [],
  featured: false,
  agentId: null,
};

const DEMOS: (PropertyInput & { photos: [string, string][] })[] = [
  {
    ...base,
    title: "Modern family home with a north-facing garden",
    transactionType: "sale",
    propertyType: "house",
    price: 2_450_000,
    suburb: "Parow Valley",
    bedrooms: 4,
    bathrooms: 2.5,
    parking: 2,
    floorArea: 220,
    landArea: 595,
    ratesAndTaxes: 1450,
    featured: true,
    features: ["Garden", "Double garage", "Braai area", "Built-in cupboards", "Fibre ready", "Alarm system"],
    description:
      "An open-plan living area flows onto a covered patio and a level garden. The kitchen has space for a family table, and all four bedrooms have built-in cupboards. The main bedroom has its own en-suite bathroom.\n\nSchools, shops and transport routes are close by.",
    photos: [
      ["KQA30E4YCM", "Contemporary double-storey facade with a dark roofline"],
      ["OE0F9BHXJQ", "Bright bedroom with large windows"],
      ["9R85GU3I2P", "Main bedroom with built-in wardrobe"],
      ["XWI13131WH", "Second bedroom with natural light"],
    ],
  },
  {
    ...base,
    title: "Two-bedroom apartment close to amenities",
    transactionType: "sale",
    propertyType: "apartment",
    price: 1_195_000,
    suburb: "Bellville",
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    floorArea: 72,
    levies: 1850,
    ratesAndTaxes: 640,
    featured: true,
    features: ["Balcony", "Secure parking", "Pet friendly"],
    description: "A well-kept apartment on an upper floor. It has a sunny balcony, an updated kitchen and secure parking.",
    photos: [
      ["DTZVUDUTRV", "Modern apartment block with timber balconies"],
      ["OE0F9BHXJQ", "Light-filled bedroom"],
    ],
  },
  {
    ...base,
    title: "Contemporary townhouse in a secure complex",
    transactionType: "sale",
    propertyType: "townhouse",
    price: 1_850_000,
    suburb: "Durbanville",
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    floorArea: 140,
    levies: 1450,
    featured: true,
    features: ["Security estate", "Garden", "Garage"],
    description: "A low-maintenance townhouse with a small private garden in a complex with 24-hour access control.",
    photos: [
      ["APYMC719T1", "Townhouse exterior with a sloping roof"],
      ["12B5400E80", "Bedroom with wooden floors"],
      ["XWI13131WH", "Sunny bedroom with sheer curtains"],
    ],
  },
  {
    ...base,
    title: "Garden apartment to rent",
    transactionType: "rent",
    propertyType: "apartment",
    price: 12_500,
    suburb: "Pinelands",
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    features: ["Garden", "Pet friendly"],
    description: "A ground-floor apartment with its own garden, available on a 12-month lease.",
    photos: [
      ["XWI13131WH", "Bedroom with sheer curtains"],
      ["9R85GU3I2P", "Bedroom and wardrobe"],
    ],
  },
  {
    ...base,
    title: "Unpublished draft — Goodwood house",
    transactionType: "sale",
    propertyType: "house",
    price: null,
    suburb: "Goodwood",
    status: "draft",
    bedrooms: 3,
    description: "Draft used to verify that unpublished listings never appear publicly.",
    photos: [],
  },
  {
    ...base,
    title: "Sold family home",
    transactionType: "sale",
    propertyType: "house",
    price: 1_650_000,
    suburb: "Parow North",
    status: "sold",
    bedrooms: 3,
    bathrooms: 1,
    description: "Shown only when 'show sold listings' is enabled in Admin → Settings.",
    photos: [["6ZANICCFI9", "Gable of a painted weatherboard house"]],
  },
];

async function storeDemoImage(propertyId: string, file: string) {
  const input = await readFile(path.join("scripts/demo-images", `${file}.jpg`));
  const id = randomUUID();
  const urls: Record<string, string> = {};
  const keys: string[] = [];
  let width = 0;
  let height = 0;
  for (const w of [480, 960, 1600]) {
    const { data, info } = await sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
    const rel = `properties/${propertyId}/${id}-${w}.webp`;
    await mkdir(path.dirname(path.join(uploads, rel)), { recursive: true });
    await writeFile(path.join(uploads, rel), data);
    urls[String(w)] = `/media/${rel}`;
    keys.push(rel);
    width = info.width;
    height = info.height;
  }
  return { urls, storageKeys: keys, width, height };
}

async function clear(db: Db) {
  const demos = await db.select({ id: schema.properties.id }).from(schema.properties).where(eq(schema.properties.isDemo, true));
  for (const d of demos) await rm(path.join(uploads, "properties", d.id), { recursive: true, force: true });
  await db.delete(schema.properties).where(eq(schema.properties.isDemo, true));
  console.log(`✓ Removed ${demos.length} demo listing(s)`);
}

async function main() {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new Error("Refusing to touch demo data in production.");
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Demo seeding writes to local storage only; unset BLOB_READ_WRITE_TOKEN.");
  const pool = createPool();
  const db = drizzle(pool, { schema }) as unknown as Db;
  try {
    const cmd = process.argv[2];
    if (cmd === "clear") return await clear(db);
    if (cmd !== "seed") throw new Error("Usage: demo.ts <seed|clear>");
    await clear(db);
    for (const { photos, ...input } of DEMOS) {
      const p = await createProperty(db, { ...input, description: DISCLAIMER + input.description }, { isDemo: true });
      for (const [file, alt] of photos) {
        await addPropertyImage(db, { propertyId: p.id, alt, ...(await storeDemoImage(p.id, file)) });
      }
      console.log(`  + ${p.reference} ${p.title} (${p.status})`);
    }
    console.log(`✓ Seeded ${DEMOS.length} demo listings`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
