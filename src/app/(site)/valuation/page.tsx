import type { Metadata } from "next";
import { Suspense } from "react";
import { ValuationForm } from "@/components/forms/valuation-form";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { PageIntro } from "@/components/ui/section-heading";
import { telLink, whatsappLink } from "@/lib/contact-links";
import { getSiteSettings } from "@/lib/server/site";
import { DEFAULT_SETTINGS, publicContact, type PublicContact } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Request a Property Valuation",
  description: "Ask an Elevate Real Estate (ERE) agent to assess your property in Parow or elsewhere in Cape Town. No obligation to list.",
  alternates: { canonical: "/valuation" },
};

function Aside({ contact }: { contact: PublicContact }) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      <div className="rounded-3xl bg-sand p-7">
        <h2 className="heading text-2xl">How it works</h2>
        <ol className="mt-4 space-y-4 text-sm">
          {[
            "Tell us about the property using this form.",
            "An ERE agent contacts you to arrange a convenient time.",
            "The agent views the property and discusses recent comparable sales with you.",
            "You receive their view of the property's market value, with no obligation to list.",
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
              <span className="pt-1">{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 border-t border-line pt-4 text-xs text-stone">
          This is a request for an agent&apos;s assessment, not an automated valuation. It is not a formal valuation by a registered property valuer.
        </p>
      </div>
      <div className="rounded-3xl border border-line bg-white p-7">
        <h2 className="font-semibold">Prefer to talk?</h2>
        <div className="mt-4 grid gap-2">
          {contact.whatsappE164 && (
            <a href={whatsappLink(contact.whatsappE164, "Hi ERE, I'd like to arrange a valuation of my property.")} target="_blank" rel="noopener" className="btn btn-whatsapp">
              <WhatsAppIcon size={18} /> WhatsApp ERE
            </a>
          )}
          <a href={telLink(contact.phoneE164)} className="btn btn-outline">
            <PhoneIcon size={18} /> {contact.phoneDisplay}
          </a>
        </div>
      </div>
    </aside>
  );
}

async function LiveAside() {
  return <Aside contact={publicContact(await getSiteSettings())} />;
}

export default function ValuationPage() {
  return (
    <>
      <PageIntro
        eyebrow="Property valuation"
        title={
          <>
            What could your property <span className="text-ere-red">sell for?</span>
          </>
        }
        intro="Tell us a little about your property and an ERE agent will contact you to arrange an assessment. Fields marked * are required. Everything else is optional."
      />
      <div className="container-site grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
        {/* The form is outside any streamed boundary so typed input is never replaced. */}
        <div className="rounded-3xl border border-line bg-white p-6 sm:p-10 lg:col-span-8">
          <ValuationForm />
        </div>
        <div className="lg:col-span-4">
          <Suspense fallback={<Aside contact={publicContact(DEFAULT_SETTINGS)} />}>
            <LiveAside />
          </Suspense>
        </div>
      </div>
    </>
  );
}
