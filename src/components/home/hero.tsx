import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getPublicSuburbs } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { getPublicStatuses } from "@/lib/server/site";
import heroImage from "../../../public/images/hero-cape-town-dawn.webp";
import { ArrowRightIcon } from "../icons";
import { SearchPanel } from "../search/search-panel";
import { unstable_rethrow } from "next/navigation";

async function SearchWithSuburbs() {
  let suburbs: string[] = [];
  try {
    suburbs = await getPublicSuburbs(getDb(), await getPublicStatuses());
  } catch (err) {
    unstable_rethrow(err);
    // Search still works with free text if suggestions can't load.
  }
  return <SearchPanel suburbs={suburbs} />;
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="on-dark relative isolate overflow-hidden bg-ink text-white">
      <Image
        src={heroImage}
        alt="Cape Town's City Bowl at dawn, with Table Mountain behind"
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        className="hero-image -z-10 object-cover object-[50%_40%]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(21_17_14/0.55)_0%,rgb(21_17_14/0.15)_30%,rgb(21_17_14/0.35)_55%,rgb(21_17_14/0.92)_100%)]" />
      <div aria-hidden="true" className="absolute inset-y-0 left-0 -z-10 w-full bg-[linear-gradient(90deg,rgb(21_17_14/0.7)_0%,transparent_65%)]" />

      <div className="container-site flex min-h-[44rem] flex-col justify-end pb-10 pt-32 sm:min-h-[48rem] lg:min-h-[max(52rem,100svh)] lg:pb-14">
        <div className="hero-stagger max-w-4xl">
          <p className="eyebrow" style={{ "--i": 0 } as React.CSSProperties}>
            Parow · Cape Town
          </p>
          <h1 id="hero-title" className="display mt-5 text-[3.6rem] sm:text-[6rem] lg:text-[8.5rem]" style={{ "--i": 1 } as React.CSSProperties}>
            <span className="block">Find your place.</span>
            <span className="block text-ere-red">Elevate</span>
            <span className="block">your future.</span>
          </h1>
          <div className="rule-grow mt-6 h-1.5 w-32 bg-ere-red [clip-path:polygon(0_35%,100%_0,100%_100%,0_65%)]" aria-hidden="true" />
          <p className="mt-6 max-w-xl text-lg text-white/85 sm:text-xl" style={{ "--i": 2 } as React.CSSProperties}>
            ERE is an estate agency based in Parow. We help people buy and sell homes across Cape Town and explain every
            step along the way, from the first viewing to registration.
          </p>
          <div className="mt-8 flex flex-wrap gap-3" style={{ "--i": 3 } as React.CSSProperties}>
            <Link href="/buy" className="btn btn-primary">
              Explore properties <ArrowRightIcon size={18} />
            </Link>
            <Link href="/sell" className="btn btn-outline">
              Sell your property
            </Link>
          </div>
        </div>

        <div className="mt-12 max-w-5xl [animation:lift_0.9s_var(--ease-out-expo)_both] [animation-delay:300ms]">
          <Suspense fallback={<SearchPanel suburbs={[]} />}>
            <SearchWithSuburbs />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
