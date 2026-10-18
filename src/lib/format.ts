const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});
const zarCents = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 1 });
// Compact labels use a decimal point ("R1.25m"), which reads better than en-ZA's comma.
const compact = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });

/** "R 1 250 000" — South African formatting (space thousands separator). */
export function formatZar(amount: number, opts: { cents?: boolean } = {}) {
  // Intl uses a non-breaking space; keep it so amounts never wrap mid-number.
  return (opts.cents ? zarCents : zar).format(amount);
}

export function formatPrice(price: number | null, transactionType: "sale" | "rent") {
  if (price == null) return "Price on application";
  return transactionType === "rent" ? `${formatZar(price)} pm` : formatZar(price);
}

/** Compact price for chips: R1.25m, R850k. */
export function formatZarShort(amount: number) {
  if (amount >= 1_000_000) return `R${compact.format(amount / 1_000_000)}m`;
  if (amount >= 1_000) return `R${compact.format(amount / 1_000)}k`;
  return `R${amount}`;
}

/** en-ZA grouping (non-breaking spaces) with a decimal point, e.g. "2.5" and "1 250". */
export function formatNumber(n: number) {
  return num.format(n).replace(",", ".");
}

export function formatArea(m2: number) {
  return `${formatNumber(m2)} m²`;
}

const dateFmt = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" });
const dateTimeFmt = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Johannesburg",
});

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}
export function formatDateTime(d: Date | string) {
  return dateTimeFmt.format(new Date(d));
}

export function pluralise(n: number, one: string, many = `${one}s`) {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
