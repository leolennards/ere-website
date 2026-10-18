import { eq } from "drizzle-orm";
import { getCurrentAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/data/audit";
import { addPropertyImage, countImages, MAX_IMAGES_PER_PROPERTY } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { ImageRejectedError, MAX_UPLOAD_BYTES, processAndStorePropertyImage } from "@/lib/server/images";
import { isSameOrigin } from "@/lib/server/request-guard";

const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  const admin = await getCurrentAdmin();
  if (!admin) return json({ error: "Your session has expired. Please sign in again." }, 401);

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Unknown property." }, 404);
  const db = getDb();
  const [property] = await db.select({ id: properties.id, reference: properties.reference }).from(properties).where(eq(properties.id, id));
  if (!property) return json({ error: "Unknown property." }, 404);
  if ((await countImages(db, id)) >= MAX_IMAGES_PER_PROPERTY) return json({ error: `A listing can have at most ${MAX_IMAGES_PER_PROPERTY} photos.` }, 400);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return json({ error: "Photo is larger than 4 MB." }, 413);

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return json({ error: "Could not read the upload." }, 400);
  }
  if (!(file instanceof File)) return json({ error: "No photo was received." }, 400);

  try {
    const stored = await processAndStorePropertyImage(id, Buffer.from(await file.arrayBuffer()));
    const row = await addPropertyImage(db, { propertyId: id, alt: "", ...stored });
    await audit(db, admin, "image.uploaded", "property", id, `Photo added to ${property.reference}`);
    return json({ id: row.id }, 201);
  } catch (err) {
    if (err instanceof ImageRejectedError) return json({ error: err.message }, 400);
    console.error("[upload] failed:", err instanceof Error ? err.message : err);
    return json({ error: "The photo could not be saved. Please try again." }, 500);
  }
}
