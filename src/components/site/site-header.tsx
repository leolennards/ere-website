"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, use, useEffect, useId, useRef, useState } from "react";
import { telLink, whatsappLink } from "@/lib/contact-links";
import { ChevronDownIcon, CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "../icons";
import { Logo } from "../logo";
import { isActive, NAV_ITEMS, type NavItem } from "./nav-items";

interface HeaderContact {
  phoneDisplay: string;
  phoneE164: string;
  whatsappE164: string | null;
}

/**
 * Mounted once (never swapped by a Suspense boundary) so an open menu survives
 * streaming; only the contact links wait for Admin → Settings.
 */
export function SiteHeader({ contact: contactPromise, fallback }: { contact: Promise<HeaderContact>; fallback: HeaderContact }) {
  const pathname = usePathname();
  const overlayRoute = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu after navigating.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const overlay = overlayRoute && !scrolled;

  return (
    <header
      data-overlay={overlay || undefined}
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,color] duration-300 ${
        overlay ? "on-dark bg-transparent text-white" : "bg-bone/92 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur-md"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="container-site flex h-[4.5rem] items-center justify-between gap-6 lg:h-20">
        <Link href="/" aria-label="ERE — Elevate Real Estate, home" className="shrink-0">
          <Logo variant={overlay ? "white" : "red"} className="h-11 w-auto lg:h-[3.25rem]" priority />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-2">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <li key={item.href}>
                  <Dropdown item={item} pathname={pathname} />
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="link-quiet rounded-sm px-2.5 py-2 text-[0.95rem] font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Suspense fallback={<HeaderContactLinks contact={fallback} />}>
            <HeaderContactLinks contact={contactPromise} />
          </Suspense>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full lg:hidden"
            aria-label="Open menu"
            aria-haspopup="dialog"
            onClick={() => dialogRef.current?.showModal()}
          >
            <MenuIcon size={26} />
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="drawer m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-ink p-0 text-white on-dark"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[4.5rem] items-center justify-between px-5">
            <Logo variant="white" className="h-10 w-auto" />
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full"
              aria-label="Close menu"
              onClick={() => dialogRef.current?.close()}
            >
              <CloseIcon size={26} />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pb-6">
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {NAV_ITEMS.flatMap((item) => (item.children ? item.children : [item])).map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="flex items-center justify-between py-4 text-xl font-semibold aria-[current=page]:text-[#ff6b62]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Suspense fallback={<MenuContactLinks contact={fallback} />}>
            <MenuContactLinks contact={contactPromise} />
          </Suspense>
        </div>
      </dialog>
    </header>
  );
}

const WA_GREETING = "Hi ERE, I'd like some help with a property.";
const useContact = (c: HeaderContact | Promise<HeaderContact>) => (typeof (c as Promise<HeaderContact>).then === "function" ? use(c as Promise<HeaderContact>) : (c as HeaderContact));

function HeaderContactLinks({ contact: c }: { contact: HeaderContact | Promise<HeaderContact> }) {
  const contact = useContact(c);
  return (
    <>
      <a href={telLink(contact.phoneE164)} className="hidden items-center gap-2 px-2 text-sm font-semibold xl:inline-flex">
        <PhoneIcon size={17} />
        {contact.phoneDisplay}
      </a>
      {contact.whatsappE164 ? (
        <a href={whatsappLink(contact.whatsappE164, WA_GREETING)} target="_blank" rel="noopener" className="btn btn-primary btn-sm hidden sm:inline-flex">
          <WhatsAppIcon size={17} />
          WhatsApp us
        </a>
      ) : (
        <a href={telLink(contact.phoneE164)} className="btn btn-primary btn-sm hidden sm:inline-flex">
          <PhoneIcon size={16} />
          Call us
        </a>
      )}
    </>
  );
}

function MenuContactLinks({ contact: c }: { contact: HeaderContact | Promise<HeaderContact> }) {
  const contact = useContact(c);
  return (
    <div className="grid gap-3 border-t border-white/10 p-5">
      {contact.whatsappE164 && (
        <a href={whatsappLink(contact.whatsappE164, WA_GREETING)} target="_blank" rel="noopener" className="btn btn-whatsapp">
          <WhatsAppIcon size={18} /> WhatsApp ERE
        </a>
      )}
      <a href={telLink(contact.phoneE164)} className="btn btn-outline">
        <PhoneIcon size={18} /> Call {contact.phoneDisplay}
      </a>
    </div>
  );
}

function Dropdown({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const active = item.children!.some((c) => isActive(pathname, c.href));

  // Close when the route changes (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`link-quiet inline-flex items-center gap-1 rounded-sm px-2.5 py-2 text-[0.95rem] font-medium ${active ? "bg-[length:100%_1.5px]" : ""}`}
      >
        {item.label}
        <ChevronDownIcon size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        id={id}
        hidden={!open}
        className="absolute left-1/2 top-full z-10 w-80 -translate-x-1/2 pt-3 text-ink [animation:var(--animate-rise)] [animation-duration:.35s]"
      >
        <ul className="rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-lift)]">
          {item.children!.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                aria-current={isActive(pathname, c.href) ? "page" : undefined}
                className="block rounded-xl px-4 py-3 transition-colors hover:bg-bone aria-[current=page]:bg-bone"
              >
                <span className="block font-semibold">{c.label}</span>
                {c.description && <span className="mt-0.5 block text-sm text-stone">{c.description}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
