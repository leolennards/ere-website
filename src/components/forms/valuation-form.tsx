"use client";

import { useActionState } from "react";
import { submitValuationRequest } from "@/app/actions/enquiries";
import { IDLE } from "@/lib/form-state";
import { VALUATION_PROPERTY_TYPES } from "@/lib/validation";
import { ConsentFields, ContactMethodField, Field, FormAlert, formKey, SpamGuard, SubmitButton, SuccessPanel } from "./fields";

export function ValuationForm({ hasWhatsApp = true }: { hasWhatsApp?: boolean }) {
  const [state, action, pending] = useActionState(submitValuationRequest, IDLE);

  if (state.status === "success") {
    return (
      <SuccessPanel reference={state.reference} title="Valuation request received">
        <p className="font-medium text-ink">What happens next</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>An ERE agent reviews the details you sent.</li>
          <li>They contact you using your preferred method to arrange a time to see the property.</li>
          <li>After the assessment, you receive the agent&apos;s view of the property&apos;s market value. You&apos;re under no obligation to list.</li>
        </ol>
      </SuccessPanel>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const v = state.status === "error" ? state.values : undefined;
  return (
    <form key={formKey(state)} action={action} className="relative grid gap-6" noValidate aria-label="Request a property valuation">
      <SpamGuard />
      <FormAlert state={state} />

      <fieldset className="grid gap-5">
        <legend className="heading mb-1 text-2xl">About the property</legend>
        <Field name="address" label="Property address or suburb" errors={errors} required hint="A street address helps the agent prepare, but the suburb alone is fine.">
          {(p) => <input {...p} className="input" autoComplete="street-address" defaultValue={v?.address} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="propertyType" label="Property type" errors={errors} required>
            {(p) => (
              <select {...p} className="select" defaultValue={v?.propertyType ?? ""}>
                <option value="" disabled>
                  Choose…
                </option>
                {VALUATION_PROPERTY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            )}
          </Field>
          <Field name="size" label="Approximate size (m²)" errors={errors}>
            {(p) => <input {...p} inputMode="numeric" className="input" defaultValue={v?.size} />}
          </Field>
          <Field name="bedrooms" label="Bedrooms" errors={errors}>
            {(p) => <input {...p} type="number" min={0} max={50} inputMode="numeric" className="input" defaultValue={v?.bedrooms} />}
          </Field>
          <Field name="bathrooms" label="Bathrooms" errors={errors}>
            {(p) => <input {...p} type="number" min={0} max={50} inputMode="numeric" className="input" defaultValue={v?.bathrooms} />}
          </Field>
        </div>
        <Field name="condition" label="Condition or anything else we should know" errors={errors} hint="For example: recent renovations, a granny flat or solar power, or work that needs doing.">
          {(p) => <textarea {...p} rows={3} className="textarea" defaultValue={v?.condition} />}
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-line pt-6">
        <legend className="heading mb-1 text-2xl">Your details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="name" label="Full name" errors={errors} required>
            {(p) => <input {...p} className="input" autoComplete="name" defaultValue={v?.name} />}
          </Field>
          <Field name="phone" label="Contact number" errors={errors} required>
            {(p) => <input {...p} type="tel" inputMode="tel" className="input" autoComplete="tel" defaultValue={v?.phone} />}
          </Field>
        </div>
        <Field name="email" label="Email" errors={errors}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" defaultValue={v?.email} />}
        </Field>
        <ContactMethodField errors={errors} defaultValue={v?.preferredContact} hasWhatsApp={hasWhatsApp} />
        <Field name="message" label="Additional message" errors={errors}>
          {(p) => <textarea {...p} rows={3} className="textarea" defaultValue={v?.message} placeholder="For example, the best times to reach you." />}
        </Field>
      </fieldset>

      <ConsentFields errors={errors} values={v} />
      <SubmitButton pending={pending} className="sm:justify-self-start">
        Request my valuation
      </SubmitButton>
    </form>
  );
}
