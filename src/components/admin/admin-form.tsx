"use client";

import { useActionState, useRef } from "react";
import { IDLE, type FormState } from "@/lib/form-state";
import { FieldError, PendingButton, ResultBanner, useUnsavedChanges } from "./kit";

export type FieldSpec =
  | { name: string; label: string; type: "text" | "email" | "tel" | "number" | "password" | "date" | "url"; value?: string; hint?: string; required?: boolean; autoComplete?: string; placeholder?: string }
  | { name: string; label: string; type: "textarea"; value?: string; hint?: string; required?: boolean; rows?: number; placeholder?: string }
  | { name: string; label: string; type: "checkbox"; value?: boolean; hint?: string }
  | { name: string; label: string; type: "select"; value?: string; hint?: string; options: [string, string][] };

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/** Generic, accessible admin form with inline validation, save confirmation and unsaved-change warnings. */
export function AdminForm({
  action,
  fields,
  submitLabel = "Save",
  columns = 1,
  resetOnSuccess = false,
}: {
  action: Action;
  fields: FieldSpec[];
  submitLabel?: string;
  columns?: 1 | 2;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const ref = useRef<HTMLFormElement>(null);
  const key = state.status === "idle" ? 0 : state.at;
  const { dirty } = useUnsavedChanges(ref, key);
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const values = state.status === "error" ? state.values : undefined;
  const val = (f: FieldSpec) => (values && f.name in values ? values[f.name] : resetOnSuccess && state.status === "success" ? "" : f.value);

  return (
    <form key={key} ref={ref} action={formAction} className="grid gap-5" noValidate>
      <ResultBanner state={state} />
      <div className={`grid gap-5 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {fields.map((f) => {
          const id = `af-${f.name}`;
          const invalid = errors?.[f.name] ? true : undefined;
          const wide = f.type === "textarea" || f.type === "checkbox";
          if (f.type === "checkbox") {
            const checked = values ? values[f.name] === "on" : Boolean(f.value);
            return (
              <label key={f.name} className={`flex items-start gap-3 ${wide && columns === 2 ? "sm:col-span-2" : ""}`}>
                <input type="checkbox" name={f.name} defaultChecked={checked} className="checkbox" />
                <span>
                  <span className="font-semibold">{f.label}</span>
                  {f.hint && <span className="block text-sm text-stone">{f.hint}</span>}
                  <FieldError errors={errors} name={f.name} />
                </span>
              </label>
            );
          }
          return (
            <div key={f.name} className={wide && columns === 2 ? "sm:col-span-2" : ""}>
              <label htmlFor={id} className="label">
                {f.label}
                {"required" in f && f.required && <span className="text-red-ink"> *</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea id={id} name={f.name} rows={f.rows ?? 4} defaultValue={String(val(f) ?? "")} className="textarea" aria-invalid={invalid} placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <select id={id} name={f.name} defaultValue={String(val(f) ?? "")} className="select" aria-invalid={invalid}>
                  {f.options.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  name={f.name}
                  type={f.type}
                  defaultValue={f.type === "password" ? "" : String(val(f) ?? "")}
                  className="input"
                  aria-invalid={invalid}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                />
              )}
              {f.hint && <p className="hint mt-1">{f.hint}</p>}
              <FieldError errors={errors} name={f.name} />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-stone" aria-live="polite">
          {dirty ? "Unsaved changes" : ""}
        </span>
        <PendingButton>{submitLabel}</PendingButton>
      </div>
    </form>
  );
}
