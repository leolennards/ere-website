import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

/**
 * Two drivers:
 * - "vercel-blob" when BLOB_READ_WRITE_TOKEN is set (production on Vercel).
 * - "local" otherwise: files under UPLOADS_DIR (default .data/uploads), served
 *   by /media/[...path] — outside /public so nothing uploaded is ever executed.
 */
const driver = process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local";
// Runtime-only directory: excluded from build-time file tracing.
const localRoot = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || ".data/uploads");
const SAFE_SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}$/;

export function storageDriver() {
  return driver;
}

export interface StoredFile {
  url: string;
  /** What deleteFiles() needs: a blob URL, or a local relative path. */
  key: string;
}

export async function putFile(relPath: string, body: Buffer, contentType: string): Promise<StoredFile> {
  if (!relPath.split("/").every((s) => SAFE_SEGMENT.test(s))) throw new Error("Unsafe storage path");
  if (driver === "vercel-blob") {
    const blob = await put(relPath, body, { access: "public", contentType, addRandomSuffix: false, cacheControlMaxAge: 31_536_000 });
    return { url: blob.url, key: blob.url };
  }
  if (process.env.VERCEL) throw new Error("Local file storage is not persistent on Vercel. Configure Vercel Blob (BLOB_READ_WRITE_TOKEN).");
  const file = path.join(/*turbopackIgnore: true*/ localRoot, relPath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return { url: `/media/${relPath}`, key: relPath };
}

export async function deleteFiles(keys: string[]) {
  if (!keys.length) return;
  if (driver === "vercel-blob") {
    await del(keys.filter((k) => k.startsWith("https://")));
    return;
  }
  await Promise.all(
    keys.map(async (k) => {
      const file = resolveLocal(k);
      if (file) await unlink(file).catch(() => undefined);
    }),
  );
}

/** Resolves a local media path, refusing anything outside the uploads root. */
export function resolveLocal(relPath: string) {
  const segments = relPath.split("/");
  if (!segments.every((s) => SAFE_SEGMENT.test(s))) return null;
  const file = path.resolve(/*turbopackIgnore: true*/ localRoot, ...segments);
  return file.startsWith(localRoot + path.sep) ? file : null;
}

export async function readLocal(relPath: string) {
  const file = resolveLocal(relPath);
  if (!file) return null;
  try {
    return await readFile(/*turbopackIgnore: true*/ file);
  } catch {
    return null;
  }
}
