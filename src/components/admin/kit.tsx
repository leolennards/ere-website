"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form-state";
import { AlertIcon, CheckIcon, CloseIcon } from "../icons";

/** Success / error banner for admin forms; announced to screen readers. */
export function ResultBanner({ state }: { state: FormState }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  useEffect(() => {
    if (state.status !== "idle") ref.current?.focus();
  }, [state]);
  if (state.status === "idle" || state.at === dismissedAt) return null;
  const success = state.status === "success";
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={success ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-xl p-4 text-sm outline-none [animation:var(--animate-fade)] ${success ? "bg-success-wash text-success" : "bg-red-wash text-red-deep"}`}
    >
      {success ? <CheckIcon size={18} className="mt-0.5 shrink-0" /> : <AlertIcon size={18} className="mt-0.5 shrink-0" />}
      <p className="flex-1">{state.message}</p>
      <button type="button" onClick={() => setDismissedAt(state.at)} aria-label="Dismiss message" className="shrink-0 opacity-70 hover:opacity-100">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

export function PendingButton({ children, className = "btn btn-primary", pendingText = "Saving…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
      {pending ? pendingText : children}
    </button>
  );
}

/**
 * Destructive action guarded by a confirmation dialog. For permanent deletes the
 * user must type DELETE, which the server action checks again.
 */
export function ConfirmAction({
  action,
  label,
  title,
  body,
  confirmLabel = "Confirm",
  requireTyping = false,
  buttonClassName = "btn btn-outline btn-sm",
}: {
  action: (fd: FormData) => void | Promise<void>;
  label: React.ReactNode;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  requireTyping?: boolean;
  buttonClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  return (
    <>
      <button type="button" className={buttonClassName} onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
        {label}
      </button>
      <dialog ref={ref} aria-label={title} className="m-auto w-[min(92vw,28rem)] rounded-2xl bg-white p-0 shadow-[var(--shadow-lift)]" onClose={() => setTyped("")}>
        <form action={action} className="grid gap-4 p-6">
          <h2 className="heading text-2xl">{title}</h2>
          <div className="text-sm text-stone">{body}</div>
          {requireTyping && (
            <div>
              <label className="label" htmlFor="confirm-typed">
                Type DELETE to confirm
              </label>
              <input id="confirm-typed" name="confirm" className="input" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => ref.current?.close()}>
              Cancel
            </button>
            <PendingButton className="btn btn-primary btn-sm" pendingText="Working…">
              {requireTyping && typed.trim().toUpperCase() !== "DELETE" ? <span className="opacity-70">{confirmLabel}</span> : confirmLabel}
            </PendingButton>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** Warns before leaving a page with unsaved edits in the referenced form. */
export function useUnsavedChanges(formRef: React.RefObject<HTMLFormElement | null>, formKey: unknown = 0) {
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const mark = () => setDirty(true);
    const clear = () => setDirty(false);
    form.addEventListener("input", mark);
    form.addEventListener("submit", clear);
    return () => {
      form.removeEventListener("input", mark);
      form.removeEventListener("submit", clear);
    };
  }, [formRef, formKey]);
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);
  return { dirty, reset: () => setDirty(false) };
}

export function FieldError({ errors, name }: { errors?: Record<string, string>; name: string }) {
  const e = errors?.[name];
  return e ? <p className="field-error">{e}</p> : null;
}
