import type { ListingStatus, TransactionType } from "@/lib/db/schema";
import { STATUS_LABELS, TRANSACTION_LABELS } from "@/lib/listing-options";

const STYLES: Record<ListingStatus, string> = {
  available: "bg-white text-ink",
  under_offer: "bg-warning-wash text-warning",
  sold: "bg-red-ink text-white",
  let: "bg-red-ink text-white",
  draft: "bg-sand text-stone",
  archived: "bg-sand text-stone",
};

/** Status always has a text label — colour is never the only signal. */
export function StatusBadge({ status, deal, className = "" }: { status: ListingStatus; deal?: TransactionType; className?: string }) {
  const label = status === "available" && deal ? TRANSACTION_LABELS[deal] : STATUS_LABELS[status];
  return (
    <span className={`badge shadow-sm ${STYLES[status]} ${className}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${status === "available" ? "bg-ere-red" : "bg-current"}`} />
      {label}
    </span>
  );
}
