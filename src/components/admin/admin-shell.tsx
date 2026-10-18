"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/admin/actions";
import { ExternalIcon, MenuIcon } from "../icons";
import { Logo } from "../logo";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/settings", label: "Site settings", owner: true },
  { href: "/admin/users", label: "Users", owner: true },
  { href: "/admin/account", label: "My account" },
];

export function AdminShell({ me, unread, children }: { me: { name: string; role: string }; unread: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin">
      <ul className="grid gap-1">
        {NAV.filter((n) => !n.owner || me.role === "owner").map((n) => (
          <li key={n.href}>
            <Link
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white aria-[current=page]:bg-white aria-[current=page]:text-ink"
            >
              {n.label}
              {n.href === "/admin/enquiries" && unread > 0 && (
                <span className="rounded-full bg-ere-red px-2 py-0.5 text-xs font-bold text-white">
                  {unread}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-bone lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="on-dark hidden bg-ink p-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link href="/admin" className="mb-8 block">
          <Logo variant="white" className="h-12 w-auto" />
          <span className="mt-2 block text-xs uppercase tracking-[0.2em] text-mist">Admin</span>
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-6 border-t border-white/10 pt-4 text-sm">
          <p className="font-semibold">{me.name}</p>
          <p className="text-xs capitalize text-mist">{me.role}</p>
          <div className="mt-3 flex items-center gap-3">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-mist hover:text-white">
              View site <ExternalIcon size={13} />
            </Link>
            <form action={logout}>
              <button className="text-mist underline-offset-2 hover:text-white hover:underline">Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      <div className="on-dark sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <Link href="/admin" aria-label="Admin dashboard">
          <Logo variant="white" className="h-9 w-auto" />
        </Link>
        <button type="button" className="inline-flex size-11 items-center justify-center" aria-expanded={open} aria-controls="admin-mobile-nav" onClick={() => setOpen((o) => !o)}>
          <MenuIcon size={24} />
          <span className="sr-only">Menu</span>
        </button>
      </div>
      {open && (
        <div id="admin-mobile-nav" className="on-dark sticky top-[60px] z-20 bg-ink px-4 pb-4 text-white lg:hidden">
          {nav}
          <form action={logout} className="mt-3 border-t border-white/10 pt-3">
            <button className="text-sm text-mist">Sign out ({me.name})</button>
          </form>
        </div>
      )}

      <main id="admin-main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

export function AdminHeader({ title, description, actions }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="heading text-4xl">{title}</h1>
        {description && <div className="mt-1 text-stone">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
