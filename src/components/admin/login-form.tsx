"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { IDLE } from "@/lib/form-state";
import { PendingButton, ResultBanner } from "./kit";

export function LoginForm() {
  const [state, action] = useActionState(login, IDLE);
  const email = state.status === "error" ? state.values?.email : "";
  return (
    <form action={action} className="grid gap-5">
      <ResultBanner state={state} />
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={email} className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <PendingButton className="btn btn-primary w-full" pendingText="Signing in…">
        Sign in
      </PendingButton>
    </form>
  );
}
