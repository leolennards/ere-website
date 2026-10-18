import type { Metadata } from "next";
import Link from "next/link";
import { MortgageCalculator } from "@/components/mortgage-calculator";
import { PageIntro } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Bond Repayment Calculator (South Africa)",
  description: "Estimate monthly home-loan repayments in rand: purchase price, deposit, interest rate, loan term and extra repayments. Illustrative only.",
  alternates: { canonical: "/bond-calculator" },
};

export default function BondCalculatorPage() {
  return (
    <>
      <PageIntro
        eyebrow="Bond calculator"
        title="Estimate your monthly bond repayment"
        intro="Adjust the price, deposit, interest rate and term to see an estimated monthly home-loan repayment in rand. Nothing you enter is stored or sent anywhere."
      />
      <section className="container-site py-14 lg:py-20" aria-label="Bond repayment calculator">
        <div className="rounded-3xl border border-line bg-white p-5 sm:p-10">
          <MortgageCalculator />
        </div>
      </section>
      <section className="container-site grid gap-10 pb-20 lg:grid-cols-3 lg:pb-28" aria-label="About this estimate">
        <div>
          <h2 className="heading text-2xl">How it&apos;s calculated</h2>
          <p className="mt-3 text-stone">
            The estimate uses the standard formula for a loan repaid in equal monthly instalments, with interest charged monthly on the outstanding
            balance at the rate you enter. Extra repayments are assumed to be paid with every instalment from the first month.
          </p>
        </div>
        <div>
          <h2 className="heading text-2xl">What it doesn&apos;t include</h2>
          <p className="mt-3 text-stone">
            Once-off costs such as transfer duty, bond registration and conveyancing fees, and bank initiation fees are not included. Neither are
            monthly bank service fees or insurance.
          </p>
        </div>
        <div>
          <h2 className="heading text-2xl">Owning a home costs more</h2>
          <p className="mt-3 text-stone">
            Your bond repayment is only part of the cost. Budget for municipal rates and taxes, levies (for sectional title), insurance, utilities
            and maintenance. Interest rates and approval are set by the lender and depend on your circumstances.{" "}
            <Link href="/contact?topic=buying" className="link">
              Talk to ERE
            </Link>{" "}
            about buying.
          </p>
        </div>
      </section>
    </>
  );
}
