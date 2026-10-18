import { formatArea, formatNumber } from "@/lib/format";
import { AreaIcon, BathIcon, BedIcon, CarIcon, LandIcon } from "../icons";

interface Facts {
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  floorArea: number | null;
  landArea: number | null;
}

/** Only facts that were actually supplied are shown — never "0" for unknown values. */
export function factList(p: Facts) {
  const out: { key: string; Icon: typeof BedIcon; value: string; label: string }[] = [];
  if (p.bedrooms != null) out.push({ key: "beds", Icon: BedIcon, value: formatNumber(p.bedrooms), label: p.bedrooms === 1 ? "bedroom" : "bedrooms" });
  if (p.bathrooms != null) out.push({ key: "baths", Icon: BathIcon, value: formatNumber(p.bathrooms), label: p.bathrooms === 1 ? "bathroom" : "bathrooms" });
  if (p.parking != null) out.push({ key: "parking", Icon: CarIcon, value: formatNumber(p.parking), label: p.parking === 1 ? "parking bay" : "parking bays" });
  if (p.floorArea != null) out.push({ key: "floor", Icon: AreaIcon, value: formatArea(p.floorArea), label: "floor area" });
  if (p.landArea != null) out.push({ key: "land", Icon: LandIcon, value: formatArea(p.landArea), label: "land area" });
  return out;
}

export function PropertyFactsInline({ property, max = 4 }: { property: Facts; max?: number }) {
  const facts = factList(property).slice(0, max);
  if (!facts.length) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone">
      {facts.map(({ key, Icon, value, label }) => (
        <li key={key} className="inline-flex items-center gap-1.5">
          <Icon size={17} className="text-ink" />
          <span>
            <span className="font-semibold text-ink">{value}</span>
            <span className="sr-only"> {label}</span>
            {(key === "floor" || key === "land") && <span aria-hidden="true" className="ml-1 text-xs">{key === "floor" ? "floor" : "erf"}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
