"use client";

import { useState } from "react";
import { googleDirectionsLink, googleMapsSearchLink } from "@/lib/contact-links";
import { ExternalIcon, PinIcon } from "./icons";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

/**
 * Google Maps Embed API (no per-load charge). Loads only on request unless
 * autoLoad is set, so Google isn't contacted until the visitor wants the map.
 * Without an API key, or if the map fails, visitors still get working links.
 */
export function MapEmbed({
  query,
  zoom = 15,
  title,
  caption,
  autoLoad = false,
  showDirections = false,
  className = "",
}: {
  query: string;
  zoom?: number;
  title: string;
  caption?: string;
  autoLoad?: boolean;
  showDirections?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(autoLoad);
  const src = KEY ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(KEY)}&q=${encodeURIComponent(query)}&zoom=${zoom}` : null;

  return (
    <figure className={className}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-sand">
        {src && loaded ? (
          <iframe
            title={title}
            src={src}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_30%_20%,#fff_0,transparent_55%),repeating-linear-gradient(45deg,transparent_0_22px,rgb(21_17_14/0.035)_22px_23px)] p-6 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-white text-red-ink shadow-md">
              <PinIcon size={26} />
            </span>
            <p className="max-w-xs text-sm text-stone">{caption ?? query}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {src && (
                <button type="button" onClick={() => setLoaded(true)} className="btn btn-dark btn-sm">
                  Show map
                </button>
              )}
              <a href={googleMapsSearchLink(query)} target="_blank" rel="noopener" className="btn btn-outline btn-sm">
                Open in Google Maps <ExternalIcon size={15} />
              </a>
            </div>
          </div>
        )}
      </div>
      {(caption || showDirections) && (
        <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-stone">
          {caption && <span>{caption}</span>}
          {showDirections && (
            <a href={googleDirectionsLink(query)} target="_blank" rel="noopener" className="link inline-flex items-center gap-1.5 font-medium">
              Get directions <ExternalIcon size={15} />
            </a>
          )}
        </figcaption>
      )}
    </figure>
  );
}
