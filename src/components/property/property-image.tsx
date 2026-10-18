import type { ImageDTO } from "@/lib/data/properties";
import { ImageIcon } from "../icons";

/**
 * Renders pre-generated WebP variants (480/960/1600w) directly — no runtime
 * image optimisation needed. Width/height prevent layout shift.
 */
export function PropertyImage({
  image,
  sizes,
  className = "",
  priority = false,
  fallbackLabel = "Photos coming soon",
}: {
  image: ImageDTO | null;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallbackLabel?: string;
}) {
  if (!image || !Object.keys(image.urls).length) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-sand text-stone ${className}`} role="img" aria-label={fallbackLabel}>
        <ImageIcon size={28} />
        <span className="text-sm">{fallbackLabel}</span>
      </div>
    );
  }
  const entries = Object.entries(image.urls)
    .map(([w, url]) => [Number(w), url] as const)
    .sort((a, b) => a[0] - b[0]);
  const srcSet = entries.map(([w, url]) => `${url} ${w}w`).join(", ");
  const src = entries.find(([w]) => w >= 960)?.[1] ?? entries.at(-1)![1];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- variants are pre-optimised at upload
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}
