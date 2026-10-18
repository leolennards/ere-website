import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageIntro } from "@/components/ui/section-heading";
import { officeAddressLines, PRIVACY_NOTICE_VERSION } from "@/config/business";
import { telLink } from "@/lib/contact-links";
import { formatDate } from "@/lib/format";
import { getSiteSettings } from "@/lib/server/site";
import { DEFAULT_SETTINGS, publicContact, type PublicContact } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy Notice (POPIA)",
  description: "How Elevate Real Estate (ERE) collects, uses and protects personal information under the Protection of Personal Information Act (POPIA).",
  alternates: { canonical: "/privacy" },
};

function ContactBlock({ c, officer }: { c: PublicContact; officer: string }) {
  return (
    <div className="not-prose rounded-2xl border border-line bg-white p-6">
      <p className="font-semibold">Information Officer: {officer}</p>
      <p className="mt-1 text-stone">{[c.name, ...officeAddressLines(c)].join(", ")}</p>
      <p className="mt-1">
        Phone:{" "}
        <a href={telLink(c.phoneE164)} className="link">
          {c.phoneDisplay}
        </a>
        {c.email && (
          <>
            {" "}
            · Email:{" "}
            <a href={`mailto:${c.email}`} className="link">
              {c.email}
            </a>
          </>
        )}
      </p>
    </div>
  );
}

async function LiveContactBlock() {
  const s = await getSiteSettings();
  return <ContactBlock c={publicContact(s)} officer={s.about.ownerName ? `${s.about.ownerName}${s.about.ownerRole ? ` (${s.about.ownerRole})` : ""}` : "the principal of ERE"} />;
}

export default function PrivacyPage() {
  return (
    <>
      <PageIntro eyebrow="Privacy" title="Privacy notice" intro={`How ERE handles your personal information. Last updated ${formatDate(PRIVACY_NOTICE_VERSION)}.`} />
      <div className="container-site py-14 lg:py-20">
        <div className="prose-ere max-w-3xl text-lg leading-relaxed">
          <p>
            Elevate Real Estate (&ldquo;ERE&rdquo;, &ldquo;we&rdquo;) respects your privacy. This notice explains what personal information we collect
            through this website, why we collect it and how we protect it, in line with South Africa&apos;s Protection of Personal Information Act 4 of
            2013 (POPIA).
          </p>

          <h2>Who is responsible</h2>
          <p>ERE is the responsible party for personal information collected through this website. Questions and requests can be sent to:</p>
          <Suspense fallback={<ContactBlock c={publicContact(DEFAULT_SETTINGS)} officer="the principal of ERE" />}>
            <LiveContactBlock />
          </Suspense>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Enquiries and valuation requests:</strong> your name, contact number, optional email address, preferred contact method, your
              message, and for valuations, the property address or suburb and the details you choose to give us.
            </li>
            <li>
              <strong>Your consent choices:</strong> the date you acknowledged this notice and whether you opted in to property updates.
            </li>
            <li>
              <strong>Security information:</strong> to prevent spam and abuse, we keep a short-lived, one-way scrambled version of your IP address. It
              cannot be used to identify you, and it is deleted automatically.
            </li>
          </ul>
          <p>We don&apos;t ask for ID numbers, financial information or other special personal information through this website.</p>

          <h2>Why we use it</h2>
          <ul>
            <li>To respond to your enquiry, arrange viewings or valuations, and help with buying, selling or renting a property.</li>
            <li>To keep a record of our communication with you about that enquiry.</li>
            <li>
              To send occasional property updates, <strong>only if you ticked the optional box</strong>. Submitting an enquiry never subscribes you to
              marketing, and you can opt out at any time.
            </li>
          </ul>

          <h2>Who we share it with</h2>
          <p>
            We don&apos;t sell your personal information. We share it only where necessary to deal with your enquiry or a resulting transaction (for
            example with a conveyancing attorney once you have agreed to proceed), where the law requires it, or with service providers who host and
            run this website for us under confidentiality obligations:
          </p>
          <ul>
            <li>website hosting, database and file storage providers</li>
            <li>an email service, used only to notify ERE that a new enquiry has arrived</li>
            <li>
              Google Maps, which receives information from your browser (such as your IP address) only when a map on this site is displayed
            </li>
          </ul>
          <p>
            Some of these providers store data outside South Africa. Where this happens we rely on providers that are bound by data-protection laws or
            agreements that give a level of protection similar to POPIA.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep enquiry records only for as long as we need them to deal with your enquiry and any transaction that follows, or for as long as the
            law requires. Enquiries that do not lead to a transaction are reviewed and deleted no later than 24 months after our last contact with you.
          </p>

          <h2>How we protect it</h2>
          <p>
            Enquiries are stored in a secured database that only authorised ERE staff can access, through password-protected accounts. Data is
            encrypted in transit (HTTPS), and access to the administration area is logged.
          </p>

          <h2>Cookies</h2>
          <p>
            This website does not use advertising or tracking cookies. ERE staff who sign in to manage the website receive a secure session cookie.
            If you choose to display a Google map, Google may set its own cookies under its{" "}
            <a href="https://policies.google.com/privacy" className="link" target="_blank" rel="noopener">
              privacy policy
            </a>
            .
          </p>

          <h2>Your rights</h2>
          <p>Under POPIA you may:</p>
          <ul>
            <li>ask whether we hold personal information about you and request a copy of it;</li>
            <li>ask us to correct or delete information that is inaccurate, out of date or that we are no longer allowed to keep;</li>
            <li>object to us processing your information, and withdraw consent to marketing at any time;</li>
            <li>
              lodge a complaint with the{" "}
              <a href="https://inforegulator.org.za" className="link" target="_blank" rel="noopener">
                Information Regulator
              </a>
              .
            </li>
          </ul>
          <p>
            To make a request, contact us using the details above. We may need to confirm your identity before we act on a request. You can also{" "}
            <Link href="/contact" className="link">
              send us a message
            </Link>
            .
          </p>

          <h2>Changes to this notice</h2>
          <p>We may update this notice. The date at the top shows when it last changed.</p>
        </div>
      </div>
    </>
  );
}
