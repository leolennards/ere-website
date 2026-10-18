import Link from "next/link";
import { telLink, whatsappLink } from "@/lib/contact-links";
import { formatZar } from "@/lib/format";
import { CALCULATOR_DEFAULTS, monthlyRepayment } from "@/lib/mortgage";
import type { PublicContact } from "@/lib/settings";
import { ArrowRightIcon, CalculatorIcon, PhoneIcon, WhatsAppIcon } from "../icons";

const exampleLoan = CALCULATOR_DEFAULTS.price * (1 - CALCULATOR_DEFAULTS.depositPct / 100);
const exampleRepayment = monthlyRepayment({ principal: exampleLoan, annualRatePct: CALCULATOR_DEFAULTS.annualRatePct, years: CALCULATOR_DEFAULTS.years });

export function ToolsBand({ contact }: { contact: PublicContact }) {
  return (
    <section aria-label="Plan and get in touch" className="py-20 lg:py-28">
      <div className="container-site grid gap-6 lg:grid-cols-12">
        <div className="reveal flex flex-col justify-between gap-8 rounded-3xl bg-sand p-8 lg:col-span-5 lg:p-10">
          <div>
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-white text-red-ink">
              <CalculatorIcon size={24} />
            </span>
            <h2 className="heading mt-6 text-4xl">What could your bond repayment be?</h2>
            <p className="mt-3 text-stone">
              For example, a {formatZar(exampleLoan)} loan over {CALCULATOR_DEFAULTS.years} years at an illustrative{" "}
              {CALCULATOR_DEFAULTS.annualRatePct}% works out to about{" "}
              <strong className="text-ink">{formatZar(Math.round(exampleRepayment))} per month</strong>. Try your own numbers.
            </p>
          </div>
          <Link href="/bond-calculator" className="btn btn-dark self-start">
            Open the bond calculator <ArrowRightIcon size={18} />
          </Link>
        </div>

        <div className="on-dark reveal flex flex-col justify-between gap-8 rounded-3xl bg-red-ink p-8 text-white lg:col-span-7 lg:p-12">
          <h2 className="display text-5xl sm:text-6xl">
            Need a new place or want to sell one?
          </h2>
          <div>
            <p className="max-w-lg text-lg text-white/90">Let Elevate Real Estate assist you. Send a message, call the office or visit us in Parow.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {contact.whatsappE164 && (
                <a href={whatsappLink(contact.whatsappE164, "Hi ERE, I'd like some help with a property.")} target="_blank" rel="noopener" className="btn btn-light">
                  <WhatsAppIcon size={18} className="text-[#128c4b]" /> WhatsApp
                </a>
              )}
              <a href={telLink(contact.phoneE164)} className="btn btn-outline">
                <PhoneIcon size={18} /> {contact.phoneDisplay}
              </a>
              <Link href="/contact" className="btn btn-outline">
                Send an enquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
