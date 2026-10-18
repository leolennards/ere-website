import Image from "next/image";
import Link from "next/link";
import street from "../../../public/images/cape-town-kloof-nek.webp";
import { ArrowRightIcon } from "../icons";

export function SellCta() {
  return (
    <section aria-labelledby="sell-title" className="px-3 sm:px-5">
      <div className="on-dark relative isolate overflow-hidden rounded-[2rem] bg-ink text-white">
        <Image src={street} alt="" fill sizes="100vw" placeholder="blur" className="-z-10 object-cover object-[60%_50%] opacity-80" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(21_17_14/0.94)_0%,rgb(21_17_14/0.7)_45%,rgb(21_17_14/0.05)_100%)]" />
        <div className="container-site grid gap-10 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="eyebrow">For homeowners</p>
            <h2 id="sell-title" className="display mt-5 text-[3rem] sm:text-7xl lg:text-8xl">
              Thinking about <span className="text-ere-red">selling?</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-white/85">
              Find out what your property could be worth on today&apos;s market. Request a valuation and an ERE agent will contact
              you to arrange an assessment. You&apos;re under no obligation to list.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/valuation" className="btn btn-primary">
                Request a valuation <ArrowRightIcon size={18} />
              </Link>
              <Link href="/sell" className="btn btn-outline">
                How selling with ERE works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
