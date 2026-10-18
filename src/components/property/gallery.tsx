"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageDTO } from "@/lib/data/properties";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ExpandIcon } from "../icons";
import { PropertyImage } from "./property-image";

/**
 * Accessible gallery: arrow keys, swipe, thumbnail navigation and a full-screen
 * lightbox (native <dialog>, so focus is trapped and Escape closes it).
 */
export function Gallery({ images, title }: { images: ImageDTO[]; title: string }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const thumbsRef = useRef<HTMLUListElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    thumbsRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [index]);

  if (count === 0) {
    return <PropertyImage image={null} sizes="100vw" className="aspect-[16/9] w-full rounded-3xl" fallbackLabel="Photos for this property are coming soon" />;
  }

  const current = images[index];
  const label = (i: number) => images[i].alt || `${title} — photo ${i + 1}`;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };
  const swipe = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") touchX.current = e.clientX;
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (touchX.current == null) return;
      const dx = e.clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    },
  };

  return (
    <div>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`Photos of ${title}`}
        tabIndex={0}
        onKeyDown={onKey}
        {...swipe}
        className="group relative overflow-hidden rounded-3xl bg-sand touch-pan-y"
      >
        <div aria-live="polite" aria-atomic="true" className="relative aspect-[4/3] sm:aspect-[16/9]">
          {images.map((img, i) => (
            <div key={img.id} className={`absolute inset-0 transition-opacity duration-500 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={i !== index}>
              {Math.abs(i - index) <= 1 || i === 0 ? (
                <PropertyImage image={{ ...img, alt: label(i) }} sizes="(min-width: 1280px) 1200px, 100vw" priority={i === 0} className="size-full" />
              ) : null}
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white sm:left-5">
              <ChevronLeftIcon size={22} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white sm:right-5">
              <ChevronRightIcon size={22} />
            </button>
          </>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 sm:bottom-5 sm:right-5">
          <span className="rounded-full bg-ink/75 px-3 py-1.5 text-sm font-medium text-white">
            {index + 1} / {count}
          </span>
          <button type="button" onClick={() => dialogRef.current?.showModal()} className="btn btn-light btn-sm shadow-md" aria-haspopup="dialog">
            <ExpandIcon size={16} /> View full screen
          </button>
        </div>
      </div>

      {count > 1 && (
        <ul ref={thumbsRef} className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Choose a photo">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                data-i={i}
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index ? "true" : undefined}
                className="block h-16 w-24 overflow-hidden rounded-xl opacity-60 ring-2 ring-transparent transition hover:opacity-100 aria-[current=true]:opacity-100 aria-[current=true]:ring-red-ink sm:h-20 sm:w-28"
              >
                <PropertyImage image={{ ...img, alt: "" }} sizes="112px" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`Photos of ${title}, full screen`}
        onKeyDown={onKey}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/97 p-0 text-white"
      >
        <div className="flex h-full flex-col" {...swipe}>
          <div className="flex items-center justify-between p-4">
            <p className="text-sm text-mist" aria-live="polite">
              Photo {index + 1} of {count}
            </p>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close full screen" className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <CloseIcon size={22} />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16">
            <PropertyImage key={current.id} image={{ ...current, alt: label(index) }} sizes="100vw" className="max-h-full w-auto max-w-full rounded-xl object-contain [animation:var(--animate-fade)]" />
            {count > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:left-4">
                  <ChevronLeftIcon size={26} />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:right-4">
                  <ChevronRightIcon size={26} />
                </button>
              </>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
