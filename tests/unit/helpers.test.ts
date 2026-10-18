import { describe, expect, it } from "vitest";
import { googleDirectionsLink, propertyWhatsappMessage, telLink, toWaDigits, whatsappLink } from "@/lib/contact-links";
import { formatPrice, formatZar, formatZarShort } from "@/lib/format";
import { newEnquiryReference, newPropertyReference, propertySlug, referenceFromSlug, slugify } from "@/lib/ids";
import { activeFilterCount, filtersToQuery, parseSearchFilters } from "@/lib/search-filters";

describe("contact links", () => {
  it("normalises South African numbers to international digits", () => {
    expect(toWaDigits("082 474 1178")).toBe("27824741178");
    expect(toWaDigits("+27 82 474 1178")).toBe("27824741178");
    expect(toWaDigits("0027824741178")).toBe("27824741178");
  });

  it("builds official click-to-chat links with an encoded message", () => {
    expect(whatsappLink("+27824741178")).toBe("https://wa.me/27824741178");
    const link = whatsappLink("082 474 1178", 'Hi ERE, "3 Bed" & more?');
    expect(link.startsWith("https://wa.me/27824741178?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe('Hi ERE, "3 Bed" & more?');
    expect(link).not.toMatch(/[ "&](?!.*text=)/);
  });

  it("includes the property reference in WhatsApp enquiries", () => {
    const msg = propertyWhatsappMessage({ title: "Family home", reference: "ERE-ABC234", url: "https://example.com/p" });
    expect(msg).toContain("ERE-ABC234");
    expect(msg).toContain("https://example.com/p");
  });

  it("builds tel and directions links", () => {
    expect(telLink("082 474 1178")).toBe("tel:+27824741178");
    expect(googleDirectionsLink("163B Market Street, Parow")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=163B%20Market%20Street%2C%20Parow",
    );
  });
});

describe("formatting", () => {
  const norm = (s: string) => s.replace(/\s/g, " ");
  it("formats rand amounts the South African way", () => {
    expect(norm(formatZar(1_250_000))).toBe("R 1 250 000");
    expect(norm(formatPrice(8500, "rent"))).toBe("R 8 500 pm");
    expect(formatPrice(null, "sale")).toBe("Price on application");
    expect(formatZarShort(1_250_000)).toBe("R1.25m");
    expect(formatZarShort(850_000)).toBe("R850k");
  });
});

describe("ids and slugs", () => {
  it("creates readable references without look-alike characters", () => {
    expect(newPropertyReference()).toMatch(/^ERE-[2-9A-HJKMNP-TV-Z]{6}$/);
    expect(newEnquiryReference(new Date("2026-10-18T10:00:00Z"))).toMatch(/^ENQ-261018-[2-9A-Z]{4}$/);
  });

  it("slugifies titles and recovers references from slugs", () => {
    expect(slugify("3 Bed Home — Parow Valley & Café!")).toBe("3-bed-home-parow-valley-and-cafe");
    const slug = propertySlug("Spacious Family Home", "Parow", "ERE-7K2M9Q");
    expect(slug).toBe("spacious-family-home-parow-ere-7k2m9q");
    expect(referenceFromSlug(slug)).toBe("ERE-7K2M9Q");
    expect(referenceFromSlug("no-reference-here")).toBeNull();
  });
});

describe("search filters", () => {
  it("parses valid parameters and drops invalid ones", () => {
    const f = parseSearchFilters({ q: " Parow ", type: "house", minPrice: "abc", maxPrice: "2000000", beds: "3", sort: "price-asc", page: "-1" });
    expect(f).toMatchObject({ q: "Parow", type: "house", maxPrice: 2_000_000, beds: 3, sort: "price-asc" });
    expect(f.minPrice).toBeUndefined();
    expect(f.page).toBeUndefined();
  });

  it("rejects unknown property types and swaps inverted price ranges", () => {
    const f = parseSearchFilters({ type: "castle", minPrice: "3000000", maxPrice: "1000000" });
    expect(f.type).toBeUndefined();
    expect(f.minPrice).toBe(1_000_000);
    expect(f.maxPrice).toBe(3_000_000);
  });

  it("round-trips to a shareable query string", () => {
    const f = parseSearchFilters({ q: "Parow", beds: "2", sort: "newest", page: "1" });
    expect(filtersToQuery(f)).toBe("?q=Parow&beds=2");
    expect(filtersToQuery(f, { page: 3 })).toBe("?q=Parow&beds=2&page=3");
    expect(activeFilterCount(f)).toBe(2);
  });
});
