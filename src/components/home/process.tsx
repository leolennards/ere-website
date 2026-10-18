import { SectionHeading } from "../ui/section-heading";

// The five stages come from ERE's own description of how it works with clients.
const STEPS = [
  { title: "Mandate", body: "We agree the mandate with you and how your property will be presented." },
  { title: "Marketing", body: "Your property is photographed, listed and marketed to buyers." },
  { title: "Buyer & offer", body: "We arrange viewings, present offers and keep you informed throughout." },
  { title: "Bond approval", body: "We follow the buyer's finance application until the bond is approved." },
  { title: "Registration", body: "We work with the conveyancing attorneys until the property is registered." },
];

const PRINCIPLES = [
  { title: "Communication comes first", body: "Everyone involved in the sale is kept up to date, so nobody is left guessing." },
  { title: "Explained step by step", body: "Buying or selling for the first time can feel daunting. We explain each stage in plain language as we go." },
  { title: "Rooted in Parow", body: "Our office is on Market Street in Parow Valley, and we work with buyers and sellers across Cape Town and the surrounding towns." },
];

export function Process() {
  return (
    <section aria-labelledby="process-title" className="on-dark relative overflow-hidden bg-ink py-20 text-white lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 select-none font-[family-name:var(--font-display)] text-[22rem] font-extrabold leading-none text-white/[0.03] [font-stretch:62%]">
        ERE
      </div>
      <div className="container-site relative">
        <div className="grid gap-10 lg:grid-cols-12">
          <SectionHeading
            id="process-title"
            className="lg:col-span-6"
            eyebrow="Why choose ERE"
            title={
              <>
                With you every <span className="text-ere-red">step</span> of the way
              </>
            }
            intro="From the day you sign the mandate to the day the property is registered with the attorneys, ERE stays involved and keeps you informed."
          />
          <ul className="grid gap-6 self-end sm:grid-cols-3 lg:col-span-6 lg:gap-8">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="reveal border-t border-white/15 pt-5">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-mist">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="reveal group relative bg-ink-2 p-6 transition-colors duration-300 hover:bg-ink-3 lg:p-7">
              <span className="display block text-6xl text-[#857d75] transition-colors duration-300 group-hover:text-ere-red" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-lg font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-mist">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
