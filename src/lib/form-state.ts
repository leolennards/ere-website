import type { FieldErrors } from "./validation";

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors; values?: Record<string, string>; at: number }
  | { status: "success"; reference: string; message?: string; at: number };

export const IDLE: FormState = { status: "idle" };

/** Plain-object copy of submitted text fields, used to repopulate a form after a validation error. */
export function formValues(fd: FormData, skip: string[] = []) {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && !k.startsWith("$") && !skip.includes(k)) out[k] = v.slice(0, 4000);
  }
  return out;
}
