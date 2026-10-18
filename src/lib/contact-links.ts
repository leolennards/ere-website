/** Normalises a South African number to E.164 digits without "+", e.g. 27824741178. */
export function toWaDigits(phone: string): string {
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `27${d.slice(1)}`;
  return d;
}

/** Official click-to-chat format: https://wa.me/<number>?text=<urlencoded>. */
export function whatsappLink(phone: string, message?: string) {
  const base = `https://wa.me/${toWaDigits(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(phone: string) {
  return `tel:+${toWaDigits(phone)}`;
}

export function propertyWhatsappMessage(p: { title: string; reference: string; url: string }) {
  return `Hi ERE, I'm interested in "${p.title}" (Ref ${p.reference}). ${p.url}\n\nCould you please send me more information?`;
}

export function googleDirectionsLink(query: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function googleMapsSearchLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
