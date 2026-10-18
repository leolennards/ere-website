import Link from "next/link";
import { SITE_URL } from "@/config/business";
import { propertyWhatsappMessage, telLink, whatsappLink } from "@/lib/contact-links";
import type { PropertyDetailDTO } from "@/lib/data/properties";
import { formatPrice, formatZar } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, TRANSACTION_LABELS } from "@/lib/listing-options";
import type { PublicContact } from "@/lib/settings";
import { AlertIcon, CheckIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "../icons";
import { MapEmbed } from "../map-embed";
import { MortgageCalculator } from "../mortgage-calculator";
import { PropertyEnquiryForm } from "../forms/property-enquiry-form";
import { factList } from "./property-facts";
import { Gallery } from "./gallery";
import { StatusBadge } from "./status-badge";

export function PropertyDetail({ p, contact, related, preview = false }: { p: PropertyDetailDTO; contact: PublicContact; related?: React.ReactNode; preview?: boolean }) {
  const url = `${SITE_URL}/properties/${p.slug}`;
  const facts = factList(p);
  const closed = p.status === "sold" || p.status === "let";
  const waMessage = propertyWhatsappMessage({ title: p.title, reference: p.reference, url });
  const backHref = p.transactionType === "sale" ? "/buy" : "/rent";

  return (
    <article className="pb-20 pt-28 lg:pt-32">
      <div className="container-site">
        <nav aria-label="Breadcrumb" className="text-sm text-stone">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="link-quiet">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={backHref} className="link-quiet">
                {p.transactionType === "sale" ? "Buy" : "Rent"}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="line-clamp-1 text-ink">
              {p.title}
            </li>
          </ol>
        </nav>

        {(p.isDemo || preview || p.status === "under_offer" || closed) && (
          <div className="mt-5 grid gap-2">
            {p.isDemo && (
              <p className="flex items-start gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white">
                <AlertIcon size={18} className="mt-0.5 shrink-0" />
                Demo listing used to test the website. This is not a real property.
              </p>
            )}
            {preview && (
              <p className="rounded-xl bg-warning-wash px-4 py-3 text-sm text-warning">
                Admin preview: status is <strong>{p.status.replace("_", " ")}</strong>. Visitors can only see this page when the listing is published.
              </p>
            )}
            {(p.status === "under_offer" || closed) && (
              <p className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-line">
                {p.status === "under_offer"
                  ? "An offer has been accepted on this property, subject to conditions. Contact us to register interest in case it becomes available again."
                  : `This property has been ${p.status === "sold" ? "sold" : "let"}. Browse our current listings or ask us about similar properties.`}
              </p>
            )}
          </div>
        )}

        <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={p.status} deal={p.transactionType} className="ring-1 ring-line" />
              <span className="badge bg-sand text-ink">{PROPERTY_TYPE_LABELS[p.propertyType]}</span>
            </div>
            <h1 className="heading mt-4 text-4xl sm:text-5xl lg:text-6xl">{p.title}</h1>
            <p className="mt-3 text-lg text-stone">
              {p.suburb}, {p.city}
            </p>
          </div>
          <div className="lg:text-right">
            <p className="display text-5xl sm:text-6xl">{formatPrice(p.price, p.transactionType)}</p>
            <p className="mt-2 text-sm text-stone">
              Ref <span className="font-mono font-medium text-ink">{p.reference}</span> · {TRANSACTION_LABELS[p.transactionType]}
            </p>
          </div>
        </header>

        <div className="mt-8">
          <Gallery images={p.images} title={p.title} />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <div className="space-y-14 lg:col-span-7 xl:col-span-8">
            {facts.length > 0 && (
              <section aria-labelledby="facts-title">
                <h2 id="facts-title" className="sr-only">
                  Key facts
                </h2>
                <dl className="flex flex-wrap gap-px overflow-hidden rounded-2xl border border-line bg-line">
                  {facts.map(({ key, Icon, value, label }) => (
                    <div key={key} className="flex min-w-[9.5rem] flex-1 flex-col bg-white p-5">
                      <Icon size={22} className="text-red-ink" />
                      <dt className="order-last mt-1 text-sm capitalize text-stone">{label}</dt>
                      <dd className="heading mt-3 text-2xl">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section aria-labelledby="desc-title">
              <h2 id="desc-title" className="heading text-3xl">
                About this property
              </h2>
              {p.description ? (
                <div className="mt-5 max-w-prose whitespace-pre-line text-lg leading-relaxed text-ink/90">{p.description}</div>
              ) : (
                <p className="mt-5 text-stone">A full description is on its way. Contact us for more information.</p>
              )}
            </section>

            {p.features.length > 0 && (
              <section aria-labelledby="features-title">
                <h2 id="features-title" className="heading text-3xl">
                  Features
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-red-wash text-red-ink">
                        <CheckIcon size={15} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(p.levies != null || p.ratesAndTaxes != null) && (
              <section aria-labelledby="costs-title">
                <h2 id="costs-title" className="heading text-3xl">
                  Monthly costs
                </h2>
                <dl className="mt-5 grid max-w-md gap-3">
                  {p.levies != null && (
                    <div className="flex justify-between border-b border-line pb-3">
                      <dt className="text-stone">Levies</dt>
                      <dd className="font-semibold">{formatZar(p.levies)} pm</dd>
                    </div>
                  )}
                  {p.ratesAndTaxes != null && (
                    <div className="flex justify-between border-b border-line pb-3">
                      <dt className="text-stone">Rates and taxes</dt>
                      <dd className="font-semibold">{formatZar(p.ratesAndTaxes)} pm</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {p.map && (
              <section aria-labelledby="map-title">
                <h2 id="map-title" className="heading text-3xl">
                  Location
                </h2>
                <MapEmbed
                  className="mt-5"
                  query={p.map.query}
                  zoom={p.map.zoom}
                  title={`Map showing ${p.map.mode === "exact" ? "the location of" : "the area around"} ${p.title}`}
                  caption={p.map.mode === "approximate" ? `Approximate location: ${p.suburb}, ${p.city}. The exact address is shared on request.` : `${p.suburb}, ${p.city}`}
                />
              </section>
            )}

            {p.transactionType === "sale" && !closed && (
              <section aria-labelledby="bond-title">
                <h2 id="bond-title" className="heading text-3xl">
                  Estimate your bond repayment
                </h2>
                <div className="mt-5 rounded-3xl border border-line bg-white p-5 sm:p-8">
                  <MortgageCalculator initialPrice={p.price} compact />
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-5 xl:col-span-4" aria-label="Enquire about this property">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-3xl border border-line bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone">{p.agent ? "Your agent" : "Speak to ERE"}</p>
                <p className="mt-2 text-xl font-semibold">{p.agent?.name ?? contact.name}</p>
                {p.agent?.role && <p className="text-sm text-stone">{p.agent.role}</p>}
                <div className="mt-5 grid gap-2">
                  {contact.whatsappE164 && (
                    <a href={whatsappLink(contact.whatsappE164, waMessage)} target="_blank" rel="noopener" className="btn btn-whatsapp">
                      <WhatsAppIcon size={18} /> WhatsApp about this property
                    </a>
                  )}
                  <a href={telLink(p.agent?.phone || contact.phoneE164)} className="btn btn-outline">
                    <PhoneIcon size={18} /> Call {p.agent?.phone || contact.phoneDisplay}
                  </a>
                  {p.agent?.email && (
                    <a href={`mailto:${p.agent.email}?subject=${encodeURIComponent(`Enquiry: ${p.reference}`)}`} className="btn btn-outline">
                      <MailIcon size={18} /> Email {p.agent.name.split(" ")[0]}
                    </a>
                  )}
                </div>
              </div>
              <div className="rounded-3xl border border-line bg-white p-6">
                <h2 className="heading text-2xl">{closed ? "Ask about similar properties" : "Request more information"}</h2>
                <p className="mb-5 mt-1 text-sm text-stone">Reference {p.reference} will be included automatically.</p>
                {preview ? (
                  <p className="rounded-xl bg-bone p-4 text-sm text-stone">The enquiry form is disabled in admin preview.</p>
                ) : (
                  <PropertyEnquiryForm propertyId={p.id} reference={p.reference} title={p.title} hasWhatsApp={Boolean(contact.whatsappE164)} />
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
      {related}
    </article>
  );
}
