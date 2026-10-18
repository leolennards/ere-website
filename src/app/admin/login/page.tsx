import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const instant = false;

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl bg-bone p-8 shadow-[var(--shadow-lift)]">
        <Logo className="mx-auto h-16 w-auto" priority />
        <h1 className="heading mt-6 text-center text-3xl">Admin sign in</h1>
        <p className="mb-6 mt-1 text-center text-sm text-stone">For ERE staff only.</p>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-stone">Forgotten your password? Ask the site owner to reset it.</p>
      </div>
    </main>
  );
}
