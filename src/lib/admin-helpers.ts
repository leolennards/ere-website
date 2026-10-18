import type { PropertyFormValues } from "@/components/admin/property-form";
import type { Property } from "./db/schema";

const s = (v: number | null) => (v == null ? "" : String(v));

export function toFormValues(p: Property): PropertyFormValues {
  return {
    reference: p.reference,
    title: p.title,
    description: p.description,
    transactionType: p.transactionType,
    propertyType: p.propertyType,
    status: p.status,
    price: s(p.price),
    bedrooms: s(p.bedrooms),
    bathrooms: s(p.bathrooms),
    parking: s(p.parking),
    floorArea: s(p.floorArea),
    landArea: s(p.landArea),
    levies: s(p.levies),
    ratesAndTaxes: s(p.ratesAndTaxes),
    suburb: p.suburb,
    city: p.city,
    streetAddress: p.streetAddress,
    latitude: s(p.latitude),
    longitude: s(p.longitude),
    mapVisibility: p.mapVisibility,
    features: p.features.join("\n"),
    featured: p.featured,
    agentId: p.agentId ?? "",
  };
}

export function pageParam(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 80) || undefined;
}
