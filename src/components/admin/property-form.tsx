"use client";

import { useActionState, useRef } from "react";
import { IDLE, type FormState } from "@/lib/form-state";
import { COMMON_FEATURES, PROPERTY_TYPE_LABELS, STATUS_LABELS, TRANSACTION_LABELS } from "@/lib/listing-options";
import { FieldError, PendingButton, ResultBanner, useUnsavedChanges } from "./kit";

export interface PropertyFormValues {
  reference: string;
  title: string;
  description: string;
  transactionType: string;
  propertyType: string;
  status: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  floorArea: string;
  landArea: string;
  levies: string;
  ratesAndTaxes: string;
  suburb: string;
  city: string;
  streetAddress: string;
  latitude: string;
  longitude: string;
  mapVisibility: string;
  features: string;
  featured: boolean;
  agentId: string;
}

export const EMPTY_PROPERTY: PropertyFormValues = {
  reference: "",
  title: "",
  description: "",
  transactionType: "sale",
  propertyType: "house",
  status: "draft",
  price: "",
  bedrooms: "",
  bathrooms: "",
  parking: "",
  floorArea: "",
  landArea: "",
  levies: "",
  ratesAndTaxes: "",
  suburb: "",
  city: "Cape Town",
  streetAddress: "",
  latitude: "",
  longitude: "",
  mapVisibility: "approximate",
  features: "",
  featured: false,
  agentId: "",
};

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

function Input({ name, label, v, errors, hint, ...rest }: { name: keyof PropertyFormValues; label: string; v: PropertyFormValues; errors?: Record<string, string>; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={`pf-${name}`} className="label">
        {label}
      </label>
      <input id={`pf-${name}`} name={name} defaultValue={String(v[name] ?? "")} className="input" aria-invalid={errors?.[name] ? true : undefined} {...rest} />
      {hint && <p className="hint mt-1">{hint}</p>}
      <FieldError errors={errors} name={name} />
    </div>
  );
}

function Select({ name, label, v, options, errors }: { name: keyof PropertyFormValues; label: string; v: PropertyFormValues; options: [string, string][]; errors?: Record<string, string> }) {
  return (
    <div>
      <label htmlFor={`pf-${name}`} className="label">
        {label}
      </label>
      <select id={`pf-${name}`} name={name} defaultValue={String(v[name])} className="select">
        {options.map(([val, l]) => (
          <option key={val} value={val}>
            {l}
          </option>
        ))}
      </select>
      <FieldError errors={errors} name={name} />
    </div>
  );
}

export function PropertyForm({ action, initial, agents, isNew }: { action: Action; initial: PropertyFormValues; agents: { id: string; name: string }[]; isNew: boolean }) {
  const [state, formAction] = useActionState(action, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const key = state.status === "idle" ? 0 : state.at;
  const { dirty } = useUnsavedChanges(formRef, key);
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const raw = state.status === "error" ? state.values : undefined;
  const v: PropertyFormValues = raw ? { ...initial, ...raw, featured: raw.featured === "on" } : initial;

  return (
    <form key={key} ref={formRef} action={formAction} className="grid gap-6" noValidate>
      <ResultBanner state={state} />

      <fieldset className="card grid gap-5 p-6">
        <legend className="heading -mb-1 px-1 text-xl">Listing</legend>
        <Input name="title" label="Title *" v={v} errors={errors} required maxLength={120} hint="E.g. “Spacious family home with pool”. Keep it factual." />
        <div className="grid gap-5 sm:grid-cols-3">
          <Select name="transactionType" label="Transaction" v={v} errors={errors} options={Object.entries(TRANSACTION_LABELS)} />
          <Select name="propertyType" label="Property type" v={v} errors={errors} options={Object.entries(PROPERTY_TYPE_LABELS)} />
          <Select name="status" label="Status" v={v} errors={errors} options={Object.entries(STATUS_LABELS)} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input name="price" label="Price (R)" v={v} errors={errors} inputMode="numeric" hint="Rentals: monthly amount. Leave empty for “Price on application”." />
          <Input name="reference" label="Reference" v={v} errors={errors} placeholder={isNew ? "Generated automatically" : undefined} hint="Format ERE-XXXXXX. Changing it changes the listing URL." />
        </div>
        <div>
          <label htmlFor="pf-description" className="label">
            Description
          </label>
          <textarea id="pf-description" name="description" rows={8} defaultValue={v.description} className="textarea" aria-invalid={errors?.description ? true : undefined} />
          <p className="hint mt-1">Plain text. Leave a blank line between paragraphs. At least 30 characters before publishing.</p>
          <FieldError errors={errors} name="description" />
        </div>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="featured" defaultChecked={v.featured} className="checkbox" />
          <span>
            <span className="font-semibold">Feature on the homepage</span>
            <span className="block text-sm text-stone">Only shown while the listing is Available or Under offer.</span>
          </span>
        </label>
      </fieldset>

      <fieldset className="card grid gap-5 p-6">
        <legend className="heading -mb-1 px-1 text-xl">Details</legend>
        <p className="-mt-2 text-sm text-stone">Leave unknown values empty. They won&apos;t be shown, and the site never shows “0” for missing facts.</p>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Input name="bedrooms" label="Bedrooms" v={v} errors={errors} inputMode="numeric" />
          <Input name="bathrooms" label="Bathrooms" v={v} errors={errors} inputMode="decimal" hint="e.g. 1.5" />
          <Input name="parking" label="Parking bays" v={v} errors={errors} inputMode="numeric" />
          <Input name="floorArea" label="Floor area (m²)" v={v} errors={errors} inputMode="numeric" />
          <Input name="landArea" label="Land / erf (m²)" v={v} errors={errors} inputMode="numeric" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input name="levies" label="Levies (R pm)" v={v} errors={errors} inputMode="numeric" />
          <Input name="ratesAndTaxes" label="Rates & taxes (R pm)" v={v} errors={errors} inputMode="numeric" />
        </div>
        <div>
          <label htmlFor="pf-features" className="label">
            Features
          </label>
          <textarea id="pf-features" name="features" rows={4} defaultValue={v.features} className="textarea" aria-describedby="pf-features-hint" />
          <p id="pf-features-hint" className="hint mt-1">
            One per line or comma-separated. Common: {COMMON_FEATURES.slice(0, 8).join(", ")}…
          </p>
          <FieldError errors={errors} name="features" />
        </div>
        <div>
          <label htmlFor="pf-agentId" className="label">
            Agent shown on the listing
          </label>
          <select id="pf-agentId" name="agentId" defaultValue={v.agentId} className="select">
            <option value="">ERE office (default)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="card grid gap-5 p-6">
        <legend className="heading -mb-1 px-1 text-xl">Location & map</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input name="suburb" label="Suburb *" v={v} errors={errors} required />
          <Input name="city" label="City *" v={v} errors={errors} required />
        </div>
        <Input name="streetAddress" label="Street address (private)" v={v} errors={errors} hint="Never shown publicly unless map visibility is “Exact”." autoComplete="off" />
        <div>
          <span className="label">Map visibility</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["approximate", "Approximate", "Shows the suburb only"],
                ["exact", "Exact", "Shows the address / coordinates"],
                ["hidden", "Hidden", "No map on the listing"],
              ] as const
            ).map(([val, l, d]) => (
              <label key={val} className="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] border-line bg-white p-3 has-checked:border-ink">
                <input type="radio" name="mapVisibility" value={val} defaultChecked={v.mapVisibility === val} className="mt-1 accent-red-ink" />
                <span>
                  <span className="block font-semibold">{l}</span>
                  <span className="text-sm text-stone">{d}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={errors} name="mapVisibility" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input name="latitude" label="Latitude (optional)" v={v} errors={errors} inputMode="decimal" placeholder="-33.90" />
          <Input name="longitude" label="Longitude (optional)" v={v} errors={errors} inputMode="decimal" placeholder="18.59" />
        </div>
        <p className="-mt-2 text-sm text-stone">Coordinates are only used for “Exact” maps. Right-click a spot in Google Maps to copy them.</p>
      </fieldset>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-4 border-t border-line bg-bone/95 px-4 py-4 backdrop-blur sm:-mx-0 sm:rounded-2xl sm:border">
        <p className="text-sm text-stone" aria-live="polite">
          {dirty ? "You have unsaved changes." : isNew ? "New listings start as drafts unless you choose another status." : "All changes saved."}
        </p>
        <PendingButton>{isNew ? "Create listing" : "Save changes"}</PendingButton>
      </div>
    </form>
  );
}
