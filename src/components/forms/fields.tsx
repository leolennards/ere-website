"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import type { FormState } from "@/lib/form-state";
import { AlertIcon, CheckIcon } from "../icons";

type Errors = Record<string, string> | undefined;

export function Field({
  name,
  label,
  errors,
  hint,
  required,
  children,
}: {
  name: string;
  label: string;
  errors?: Errors;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string; name: string; required?: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const error = errors?.[name];
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required ? <span className="text-red-ink"> *</span> : <span className="font-normal text-stone"> (optional)</span>}
      </label>
      {children({ id, name, required, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && (
        <p id={`${id}-hint`} className="hint mt-1.5">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactMethodField({ errors, defaultValue = "phone", hasWhatsApp = true }: { errors?: Errors; defaultValue?: string; hasWhatsApp?: boolean }) {
  const options = [
    ["phone", "Phone call"],
    ...(hasWhatsApp ? [["whatsapp", "WhatsApp"]] : []),
    ["email", "Email"],
  ];
  return (
    <fieldset>
      <legend className="label">
        How should we contact you?<span className="text-red-ink"> *</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label key={v} className="relative">
            <input type="radio" name="preferredContact" value={v} defaultChecked={defaultValue === v} className="peer sr-only" />
            <span className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-4 text-sm font-medium transition-colors hover:border-mist peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-ink">
              {l}
            </span>
          </label>
        ))}
      </div>
      {errors?.preferredContact && <p className="field-error">{errors.preferredContact}</p>}
    </fieldset>
  );
}

/** Required privacy acknowledgement plus a separate, unticked, optional marketing opt-in. */
export function ConsentFields({ errors, values }: { errors?: Errors; values?: Record<string, string> }) {
  const id = useId();
  return (
    <div className="grid gap-3 rounded-xl bg-bone p-4 text-sm">
      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="privacy"
            required
            defaultChecked={values?.privacy === "on"}
            className="checkbox"
            aria-invalid={errors?.privacy ? true : undefined}
            aria-describedby={errors?.privacy ? `${id}-perr` : undefined}
          />
          <span>
            I have read the{" "}
            <Link href="/privacy" className="link" target="_blank">
              privacy notice
            </Link>{" "}
            and agree that ERE may use these details to respond to this enquiry.<span className="text-red-ink"> *</span>
          </span>
        </label>
        {errors?.privacy && (
          <p id={`${id}-perr`} className="field-error ml-8">
            {errors.privacy}
          </p>
        )}
      </div>
      <label className="flex items-start gap-3 text-stone">
        <input type="checkbox" name="marketing" defaultChecked={values?.marketing === "on"} className="checkbox" />
        <span>Optional: send me occasional property updates from ERE. You can unsubscribe at any time.</span>
      </label>
    </div>
  );
}

/** Anti-spam: a honeypot field plus the time the form was first shown (set in the browser). */
export function SpamGuard() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current && !ref.current.value) ref.current.value = String(Date.now());
  }, []);
  return (
    <>
      <input ref={ref} type="hidden" name="startedAt" />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="ere_website_url" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
    </>
  );
}

export function FormAlert({ state }: { state: FormState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") ref.current?.focus();
  }, [state]);
  if (state.status !== "error") return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="flex items-start gap-3 rounded-xl border border-red-ink/30 bg-red-wash p-4 text-sm outline-none">
      <AlertIcon size={20} className="mt-0.5 shrink-0 text-red-ink" />
      <p>{state.message}</p>
    </div>
  );
}

export function SuccessPanel({ reference, title, children }: { reference: string; title: string; children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div ref={ref} tabIndex={-1} role="status" className="rounded-2xl border border-success/30 bg-success-wash p-6 outline-none [animation:var(--animate-rise)]">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-success text-white">
        <CheckIcon size={22} />
      </span>
      <h3 className="heading mt-4 text-2xl">{title}</h3>
      <p className="mt-2">
        Your reference number is <strong className="whitespace-nowrap font-mono text-base">{reference}</strong>. Please keep it for your records.
      </p>
      {children && <div className="mt-3 text-sm text-stone">{children}</div>}
    </div>
  );
}

export function SubmitButton({ pending, children, className = "" }: { pending: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button type="submit" className={`btn btn-primary ${className}`} disabled={pending} aria-disabled={pending}>
      {pending && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {pending ? "Sending…" : children}
    </button>
  );
}

/** Remount key: changes with every new result so inputs pick up returned values. */
export function formKey(state: FormState) {
  return state.status === "idle" ? 0 : state.at;
}
