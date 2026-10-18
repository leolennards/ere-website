import { z } from "zod";
import { propertyType } from "./db/schema";

export const SORT_OPTIONS = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
export type SortOption = keyof typeof SORT_OPTIONS;

export const PAGE_SIZE = 12;

const optInt = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(max).optional(),
  ).catch(undefined);

/** Parses untrusted URL query parameters. Invalid values are dropped, not errors. */
export const searchFiltersSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  type: z.enum(propertyType.enumValues).optional().catch(undefined),
  minPrice: optInt(1_000_000_000),
  maxPrice: optInt(1_000_000_000),
  beds: optInt(20),
  baths: optInt(20),
  parking: optInt(20),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional().catch(undefined),
  page: optInt(10_000),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export function parseSearchFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params)) flat[k] = Array.isArray(v) ? v[0] : v;
  const f = searchFiltersSchema.parse(flat);
  if (f.q === "") f.q = undefined;
  if (f.minPrice != null && f.maxPrice != null && f.minPrice > f.maxPrice) {
    [f.minPrice, f.maxPrice] = [f.maxPrice, f.minPrice];
  }
  return f;
}

/** Serialises filters back into a query string (page omitted unless > 1). */
export function filtersToQuery(f: SearchFilters, overrides: Partial<SearchFilters> = {}) {
  const merged = { ...f, ...overrides };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v == null || v === "") continue;
    if (k === "page" && Number(v) <= 1) continue;
    if (k === "sort" && v === "newest") continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function activeFilterCount(f: SearchFilters) {
  return (["q", "type", "minPrice", "maxPrice", "beds", "baths", "parking"] as const).filter((k) => f[k] != null).length;
}
