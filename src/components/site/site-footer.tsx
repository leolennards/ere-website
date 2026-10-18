import Link from "next/link";
import { officeAddressLines } from "@/config/business";
import { telLink, whatsappLink } from "@/lib/contact-links";
import type { PublicContact } from "@/lib/settings";
import { FacebookIcon, InstagramIcon, LinkedInIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "../icons";
import { Logo } from "../logo";

const COLUMNS = [
  {
    title: "Properties",
    links: [
      { href: "/buy", label: "Properties for sale" },
      { href: "/rent", label: "Properties to rent" },
      { href: "/bond-calculator", label: "Bond calculator" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { href: "/sell", label: "Sell your property" },
      { href: "/valuation", label: "Request a valuation" },
    ],
  },
  {
    title: "ERE",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About ERE" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy notice (POPIA)" },
      { href: "/credits", label: "Image credits" },
    ],
  },
];

export function SiteFooter({ contact, year }: { contact: PublicContact; year?: number }) {
  const socials = [
    { href: contact.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: contact.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: contact.social.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
  ].filter((s) => s.href);

  return (
    <footer className="on-dark bg-ink text-white">
      <div className="container-site grid gap-12 py-16 md:grid-cols-12 lg:py-20">
        <div className="md:col-span-5 lg:col-span-4">
          <Logo variant="white" className="h-16 w-auto" />
          <p className="mt-6 max-w-sm text-mist">
            A Parow-based estate agency helping people buy and sell property across Cape Town, with clear communication
            from first conversation to registration.
          </p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2" aria-label="ERE on social media">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener"
                    aria-label={label}
                    className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-white hover:bg-white hover:text-ink"
                  >
                    <Icon size={18} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7 lg:col-span-5">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-mist">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-quiet">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="md:col-span-12 lg:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-mist">Visit or call</h2>
          <address className="mt-4 space-y-3 not-italic">
            <p className="flex gap-3">
              <PinIcon size={18} className="mt-1 shrink-0 text-[#ff6b62]" />
              <span>
                {officeAddressLines(contact).map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </span>
            </p>
            <p>
              <a href={telLink(contact.phoneE164)} className="link-quiet inline-flex items-center gap-3">
                <PhoneIcon size={18} className="text-[#ff6b62]" />
                {contact.phoneDisplay}
              </a>
            </p>
            {contact.whatsappE164 && (
              <p>
                <a href={whatsappLink(contact.whatsappE164)} target="_blank" rel="noopener" className="link-quiet inline-flex items-center gap-3">
                  <WhatsAppIcon size={18} className="text-[#ff6b62]" />
                  WhatsApp
                </a>
              </p>
            )}
            {contact.email && (
              <p>
                <a href={`mailto:${contact.email}`} className="link-quiet inline-flex items-center gap-3 break-all">
                  <MailIcon size={18} className="shrink-0 text-[#ff6b62]" />
                  {contact.email}
                </a>
              </p>
            )}
            {contact.hours && <p className="whitespace-pre-line pt-1 text-sm text-mist">{contact.hours}</p>}
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-3 py-6 text-sm text-mist md:flex-row md:items-center md:justify-between">
          <p>
            © {year ? `${year} ` : ""}
            {contact.name}. All rights reserved.
          </p>
          {contact.disclosures ? <p className="max-w-2xl whitespace-pre-line">{contact.disclosures}</p> : null}
        </div>
      </div>
    </footer>
  );
}
