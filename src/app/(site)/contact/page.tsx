import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/forms/contact-form";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { MapEmbed } from "@/components/map-embed";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { PageIntro } from "@/components/ui/section-heading";
import { officeAddressLines, officeMapsQuery } from "@/config/business";
import { telLink, whatsappLink } from "@/lib/contact-links";
import { getSiteSettings } from "@/lib/server/site";
import { DEFAULT_SETTINGS, publicContact, type PublicContact } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact ERE — Parow, Cape Town",
  description: "Contact Elevate Real Estate (ERE) at 163B Market Street, Parow Valley, Cape Town. Call 082 474 1178, send a WhatsApp or use the enquiry form.",
  alternates: { canonical: "/contact" },
};

function Details({ c }: { c: PublicContact }) {
  return (
    <div className="space-y-6">
      <ul className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line">
        <li className="flex gap-4 bg-white p-6">
          <PinIcon size={22} className="mt-0.5 shrink-0 text-red-ink" />
          <div>
            <h2 className="font-semibold">Office</h2>
            <address className="mt-1 not-italic text-stone">
              {c.name}
              {officeAddressLines(c).map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
          </div>
        </li>
        <li className="flex gap-4 bg-white p-6">
          <PhoneIcon size={22} className="mt-0.5 shrink-0 text-red-ink" />
          <div>
            <h2 className="font-semibold">Phone</h2>
            <a href={telLink(c.phoneE164)} className="link mt-1 inline-block text-lg">
              {c.phoneDisplay}
            </a>
          </div>
        </li>
        {c.whatsappE164 && (
          <li className="flex gap-4 bg-white p-6">
            <WhatsAppIcon size={22} className="mt-0.5 shrink-0 text-red-ink" />
            <div>
              <h2 className="font-semibold">WhatsApp</h2>
              <a href={whatsappLink(c.whatsappE164, "Hi ERE, I'd like some help with a property.")} target="_blank" rel="noopener" className="link mt-1 inline-block">
                Send us a WhatsApp message
              </a>
              <p className="mt-1 text-sm text-stone">If WhatsApp doesn&apos;t open, please call instead.</p>
            </div>
          </li>
        )}
        {c.email && (
          <li className="flex gap-4 bg-white p-6">
            <MailIcon size={22} className="mt-0.5 shrink-0 text-red-ink" />
            <div>
              <h2 className="font-semibold">Email</h2>
              <a href={`mailto:${c.email}`} className="link mt-1 inline-block break-all">
                {c.email}
              </a>
            </div>
          </li>
        )}
        {c.hours && (
          <li className="flex gap-4 bg-white p-6">
            <ClockIcon size={22} className="mt-0.5 shrink-0 text-red-ink" />
            <div>
              <h2 className="font-semibold">Office hours</h2>
              <p className="mt-1 whitespace-pre-line text-stone">{c.hours}</p>
            </div>
          </li>
        )}
      </ul>
      <MapEmbed
        autoLoad
        showDirections
        query={officeMapsQuery(c)}
        zoom={16}
        title="Map showing the ERE office at 163B Market Street, Parow Valley"
        caption={`${c.streetAddress}, ${c.suburb}`}
      />
    </div>
  );
}

async function LiveDetails() {
  return <Details c={publicContact(await getSiteSettings())} />;
}

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title={
          <>
            Let&apos;s talk <span className="text-ere-red">property</span>
          </>
        }
        intro="Whether you're buying, selling or just have a question, call, send a WhatsApp, visit the office in Parow or use the form below."
      />
      <div className="container-site grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <Suspense fallback={<Details c={publicContact(DEFAULT_SETTINGS)} />}>
            <LiveDetails />
          </Suspense>
        </div>
        {/* The form is outside any streamed boundary so typed input is never replaced. */}
        <div className="rounded-3xl border border-line bg-white p-6 sm:p-10 lg:col-span-7">
          <h2 className="heading text-3xl">Send an enquiry</h2>
          <p className="mb-6 mt-2 text-stone">We&apos;ll reply using the contact method you choose.</p>
          <ContactForm />
        </div>
      </div>
      <Suspense>
        <OrganizationJsonLd />
      </Suspense>
    </>
  );
}
