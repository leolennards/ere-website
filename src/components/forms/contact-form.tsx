"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitGeneralEnquiry } from "@/app/actions/enquiries";
import { IDLE } from "@/lib/form-state";
import { ConsentFields, ContactMethodField, Field, FormAlert, formKey, SpamGuard, SubmitButton, SuccessPanel } from "./fields";

const TOPICS: Record<string, { label: string; prompt: string }> = {
  buying: { label: "Buying a property", prompt: "I'm looking to buy. My budget, preferred areas and must-haves are:" },
  renting: { label: "Renting a property", prompt: "I'm looking to rent. My budget, preferred areas and move-in date are:" },
  selling: { label: "Selling a property", prompt: "I'm thinking about selling my property in:" },
  area: { label: "Whether ERE covers my area", prompt: "Do you work in this area: " },
  other: { label: "Something else", prompt: "" },
};

export function ContactForm({ hasWhatsApp = true }: { hasWhatsApp?: boolean }) {
  const [state, action, pending] = useActionState(submitGeneralEnquiry, IDLE);
  const initialTopic = "other";
  const formRef = useRef<HTMLFormElement>(null);

  // Pre-select the topic from links such as /contact?topic=selling, unless the visitor has already typed.
  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("topic");
    const form = formRef.current;
    if (!form || !topic || !TOPICS[topic]) return;
    const select = form.elements.namedItem("topic") as HTMLSelectElement | null;
    const message = form.elements.namedItem("message") as HTMLTextAreaElement | null;
    if (select && select.value === "other") select.value = topic;
    if (message && message.value === "") message.value = TOPICS[topic].prompt;
  }, []);

  if (state.status === "success") {
    return (
      <SuccessPanel reference={state.reference} title="Thank you — message received">
        A member of the ERE team will contact you using the method you chose.
      </SuccessPanel>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const v = state.status === "error" ? state.values : undefined;
  return (
    <form ref={formRef} key={formKey(state)} action={action} className="relative grid gap-5" noValidate aria-label="Contact ERE">
      <SpamGuard />
      <FormAlert state={state} />
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
      <Field name="topic" label="What is this about?" errors={errors} required>
        {(p) => (
          <select {...p} className="select" defaultValue={v?.topic ?? initialTopic}>
            {Object.entries(TOPICS).map(([k, t]) => (
              <option key={k} value={k}>
                {t.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <ContactMethodField errors={errors} defaultValue={v?.preferredContact} hasWhatsApp={hasWhatsApp} />
      <Field name="message" label="Message" errors={errors} required>
        {(p) => <textarea {...p} rows={5} className="textarea" defaultValue={v?.message ?? TOPICS[initialTopic].prompt} />}
      </Field>
      <ConsentFields errors={errors} values={v} />
      <SubmitButton pending={pending} className="sm:justify-self-start">
        Send message
      </SubmitButton>
    </form>
  );
}
