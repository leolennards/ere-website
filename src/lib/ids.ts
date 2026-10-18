import { randomInt } from "node:crypto";

// Crockford-style alphabet without look-alikes (0/O, 1/I/L, U).
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function randomCode(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** Public listing reference, e.g. ERE-7K2M9Q. */
export function newPropertyReference() {
  return `ERE-${randomCode(6)}`;
}

/** Enquiry reference given to the visitor, e.g. ENQ-261018-K7Q3. */
export function newEnquiryReference(now = new Date()) {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `ENQ-${ymd}-${randomCode(4)}`;
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Slugs end with the reference so an old slug can be resolved after a title change. */
export function propertySlug(title: string, suburb: string, reference: string) {
  const base = slugify(`${title} ${suburb}`) || "property";
  return `${base}-${reference.toLowerCase()}`;
}

export function referenceFromSlug(slug: string) {
  const m = /(ere-[a-z0-9]{4,12})$/i.exec(slug);
  return m ? m[1].toUpperCase() : null;
}
