import type { EnquiryStatus, EnquiryType, ListingStatus, PropertyType, TransactionType } from "./db/schema";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: "House",
  apartment: "Apartment",
  townhouse: "Townhouse",
  cluster: "Cluster home",
  land: "Vacant land",
  commercial: "Commercial",
  other: "Other",
};

export const TRANSACTION_LABELS: Record<TransactionType, string> = { sale: "For sale", rent: "To rent" };

export const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  available: "Available",
  under_offer: "Under offer",
  sold: "Sold",
  let: "Let",
  archived: "Archived",
};

export const ENQUIRY_TYPE_LABELS: Record<EnquiryType, string> = {
  property: "Property enquiry",
  valuation: "Valuation request",
  general: "General enquiry",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const SALE_PRICE_STEPS = [
  500_000, 750_000, 1_000_000, 1_250_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000, 7_500_000,
  10_000_000, 15_000_000, 20_000_000,
];
export const RENT_PRICE_STEPS = [3_000, 5_000, 7_500, 10_000, 12_500, 15_000, 20_000, 25_000, 30_000, 40_000, 50_000];

export const COMMON_FEATURES = [
  "Garden",
  "Swimming pool",
  "Garage",
  "Off-street parking",
  "Braai area",
  "Built-in cupboards",
  "Alarm system",
  "Electric fence",
  "Fibre ready",
  "Pet friendly",
  "Solar / inverter",
  "Borehole / wellpoint",
  "Granny flat",
  "Sea view",
  "Mountain view",
  "Security estate",
];
