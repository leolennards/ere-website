import "server-only";
import { randomUUID } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import { putFile, type StoredFile } from "./storage";

export const IMAGE_WIDTHS = [480, 960, 1600] as const;
// Vercel limits request bodies to 4.5 MB; the admin uploader downsizes photos in the browser first.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif"]);
const MIN_WIDTH = 600;

export class ImageRejectedError extends Error {}

/**
 * Validates an uploaded image by decoding it (the browser's filename and MIME
 * type are never trusted), auto-rotates it, strips all metadata (including GPS
 * coordinates, which could reveal a home's location) and writes WebP variants.
 */
export async function processAndStorePropertyImage(propertyId: string, input: Buffer) {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new ImageRejectedError("Image is larger than 4 MB.");
  let meta: Metadata;
  try {
    meta = await sharp(input, { failOn: "error", limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new ImageRejectedError("This file is not a readable image.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new ImageRejectedError("Use a JPEG, PNG, WebP, AVIF or HEIC photo.");
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = (rotated ? meta.height : meta.width) ?? 0;
  if (width < MIN_WIDTH) throw new ImageRejectedError(`Image is too small (${width}px wide). Use at least ${MIN_WIDTH}px.`);

  const id = randomUUID();
  const urls: Record<string, string> = {};
  const stored: StoredFile[] = [];
  let outW = 0;
  let outH = 0;
  for (const w of IMAGE_WIDTHS) {
    if (w > width && w !== IMAGE_WIDTHS[0]) continue;
    const { data, info } = await sharp(input, { failOn: "error", limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    const file = await putFile(`properties/${propertyId}/${id}-${w}.webp`, data, "image/webp");
    stored.push(file);
    urls[String(w)] = file.url;
    outW = info.width;
    outH = info.height;
  }
  return { urls, storageKeys: stored.map((s) => s.key), width: outW, height: outH };
}
