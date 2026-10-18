"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { removeImage, reorderImage, setImageAlt } from "@/app/admin/actions";
import { ImageIcon } from "../icons";
import { ConfirmAction, PendingButton } from "./kit";

interface AdminImage {
  id: string;
  thumb: string;
  alt: string;
  width: number;
  height: number;
}

type Upload = { name: string; progress: number; error?: string; done?: boolean };

const MAX_EDGE = 2400;

/** Downscales large photos in the browser so uploads stay well under the 4 MB server limit. */
async function prepare(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 3_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.88));
  } catch {
    return file;
  }
}

function send(propertyId: string, blob: Blob, name: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", blob, name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/properties/${propertyId}/images`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = "Upload failed.";
      try {
        msg = JSON.parse(xhr.responseText).error ?? msg;
      } catch {}
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection and try again."));
    xhr.send(fd);
  });
}

export function ImageManager({ propertyId, images }: { propertyId: string; images: AdminImage[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const busy = uploads.some((u) => !u.done && !u.error);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploads(list.map((f) => ({ name: f.name, progress: 0 })));
    for (const [i, file] of list.entries()) {
      const update = (patch: Partial<Upload>) => setUploads((u) => u.map((x, j) => (j === i ? { ...x, ...patch } : x)));
      try {
        const blob = await prepare(file);
        await send(propertyId, blob, file.name, (p) => update({ progress: p }));
        update({ progress: 100, done: true });
      } catch (err) {
        update({ error: err instanceof Error ? err.message : "Upload failed." });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <section aria-labelledby="photos-title" className="card grid gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="photos-title" className="heading text-xl">
            Photos <span className="text-stone">({images.length})</span>
          </h2>
          <p className="text-sm text-stone">The first photo is the cover. JPEG, PNG or WebP, at least 600 px wide. Location data (GPS) is removed automatically.</p>
        </div>
        <label className={`btn btn-dark btn-sm ${busy ? "pointer-events-none opacity-60" : "cursor-pointer"}`}>
          <ImageIcon size={16} /> {busy ? "Uploading…" : "Add photos"}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} disabled={busy} />
        </label>
      </div>

      {uploads.length > 0 && (
        <ul className="grid gap-2" aria-live="polite" aria-label="Upload progress">
          {uploads.map((u, i) => (
            <li key={i} className="rounded-xl bg-bone p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="truncate">{u.name}</span>
                <span className={u.error ? "text-red-ink" : u.done ? "text-success" : "text-stone"}>{u.error ? "Failed" : u.done ? "Uploaded" : `${u.progress}%`}</span>
              </div>
              {u.error ? (
                <p className="mt-1 text-red-ink">{u.error}</p>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={u.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${u.name}`}>
                  <div className="h-full bg-red-ink transition-[width]" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-mist p-8 text-center text-stone">No photos yet. Listings with good photos get far more attention.</p>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="relative aspect-[4/3] bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb} alt={img.alt || `Photo ${i + 1}`} className="size-full object-cover" width={img.width} height={img.height} />
                {i === 0 && <span className="badge absolute left-2 top-2 bg-red-ink text-white">Cover</span>}
              </div>
              <div className="grid gap-2 p-3">
                <form action={setImageAlt.bind(null, propertyId, img.id)} className="flex gap-2">
                  <label htmlFor={`alt-${img.id}`} className="sr-only">
                    Description of photo {i + 1}
                  </label>
                  <input id={`alt-${img.id}`} name="alt" defaultValue={img.alt} placeholder="Describe the photo (alt text)" className="input min-h-9 py-1.5 text-sm" maxLength={200} />
                  <PendingButton className="btn btn-outline btn-sm">Save</PendingButton>
                </form>
                <div className="flex flex-wrap gap-1.5">
                  <form action={reorderImage.bind(null, propertyId, img.id, "up")}>
                    <button className="btn btn-outline btn-sm" disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>
                      ↑
                    </button>
                  </form>
                  <form action={reorderImage.bind(null, propertyId, img.id, "down")}>
                    <button className="btn btn-outline btn-sm" disabled={i === images.length - 1} aria-label={`Move photo ${i + 1} later`}>
                      ↓
                    </button>
                  </form>
                  {i > 0 && (
                    <form action={reorderImage.bind(null, propertyId, img.id, "first")}>
                      <button className="btn btn-outline btn-sm">Make cover</button>
                    </form>
                  )}
                  <ConfirmAction
                    action={removeImage.bind(null, propertyId, img.id)}
                    label="Delete"
                    title="Delete this photo?"
                    body="The photo will be removed from the listing and deleted from storage. This can't be undone."
                    confirmLabel="Delete photo"
                    buttonClassName="btn btn-sm ml-auto text-red-ink hover:bg-red-wash"
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
