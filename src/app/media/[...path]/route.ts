import { readLocal, storageDriver } from "@/lib/server/storage";

/**
 * Serves locally stored uploads (development / self-hosting). Only WebP files
 * produced by the image pipeline are served, always with a fixed image type.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rel = path.join("/");
  if (storageDriver() !== "local" || !rel.endsWith(".webp")) return new Response("Not found", { status: 404 });
  const data = await readLocal(rel);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
