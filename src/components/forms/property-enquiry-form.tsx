"use client";

import { useActionState } from "react";
import { submitPropertyEnquiry } from "@/app/actions/enquiries";
import { IDLE } from "@/lib/form-state";
import { ConsentFields, ContactMethodField, Field, FormAlert, formKey, SpamGuard, SubmitButton, SuccessPanel } from "./fields";

export function PropertyEnquiryForm({ propertyId, reference, title, hasWhatsApp }: { propertyId: string; reference: string; title: string; hasWhatsApp: boolean }) {
  const [state, action, pending] = useActionState(submitPropertyEnquiry, IDLE);

  if (state.status === "success") {
    return (
      <SuccessPanel reference={state.reference} title="Thank you — enquiry received">
        An ERE agent will contact you about <strong>{reference}</strong> using the contact method you chose.
      </SuccessPanel>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const v = state.status === "error" ? state.values : undefined;
  return (
    <form key={formKey(state)} action={action} className="relative grid gap-4" noValidate aria-label={`Enquire about ${title}`}>
      <input type="hidden" name="propertyId" value={propertyId} />
      <SpamGuard />
      <FormAlert state={state} />
      <Field name="name" label="Full name" errors={errors} required>
        {(p) => <input {...p} className="input" autoComplete="name" defaultValue={v?.name} />}
      </Field>
      <Field name="phone" label="Contact number" errors={errors} required>
        {(p) => <input {...p} type="tel" inputMode="tel" className="input" autoComplete="tel" defaultValue={v?.phone} placeholder="e.g. 082 123 4567" />}
      </Field>
      <Field name="email" label="Email" errors={errors}>
        {(p) => <input {...p} type="email" className="input" autoComplete="email" defaultValue={v?.email} />}
      </Field>
      <ContactMethodField errors={errors} defaultValue={v?.preferredContact} hasWhatsApp={hasWhatsApp} />
      <Field name="message" label="Message" errors={errors}>
        {(p) => (
          <textarea
            {...p}
            rows={4}
            className="textarea"
            defaultValue={v?.message ?? `Hi ERE, I'm interested in ${reference} and would like more information or to arrange a viewing.`}
          />
        )}
      </Field>
      <ConsentFields errors={errors} values={v} />
      <SubmitButton pending={pending} className="w-full">
        Send enquiry
      </SubmitButton>
    </form>
  );
}
