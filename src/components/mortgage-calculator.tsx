"use client";

import { useId, useMemo, useState } from "react";
import { formatZar } from "@/lib/format";
import { CALCULATOR_DEFAULTS, LOAN_TERM_OPTIONS, scheduledSummary, withExtraPayment } from "@/lib/mortgage";

const parseRand = (s: string) => {
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const groupRand = (n: number) => (n ? new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(n) : "");

function MoneyInput({ id, value, onChange, label, describedBy }: { id: string; value: number; onChange: (n: number) => void; label: string; describedBy?: string }) {
  const [text, setText] = useState(groupRand(value));
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-stone">
        R
      </span>
      <input
        id={id}
        aria-label={label}
        aria-describedby={describedBy}
        inputMode="numeric"
        className="input pl-8 text-lg font-semibold"
        value={text}
        onChange={(e) => {
          const n = Math.min(parseRand(e.target.value), 1_000_000_000);
          setText(e.target.value);
          onChange(n);
        }}
        onBlur={() => setText(groupRand(value))}
      />
    </div>
  );
}

export function MortgageCalculator({ initialPrice, compact = false }: { initialPrice?: number | null; compact?: boolean }) {
  const id = useId();
  const [price, setPrice] = useState(initialPrice ?? CALCULATOR_DEFAULTS.price);
  const [depositMode, setDepositMode] = useState<"pct" | "amount">("pct");
  const [depositPct, setDepositPct] = useState<number>(CALCULATOR_DEFAULTS.depositPct);
  const [depositAmount, setDepositAmount] = useState(Math.round(((initialPrice ?? CALCULATOR_DEFAULTS.price) * CALCULATOR_DEFAULTS.depositPct) / 100));
  const [rate, setRate] = useState<string>(String(CALCULATOR_DEFAULTS.annualRatePct));
  const [years, setYears] = useState<number>(CALCULATOR_DEFAULTS.years);
  const [extra, setExtra] = useState(0);

  const deposit = Math.min(price, depositMode === "pct" ? Math.round((price * Math.min(100, Math.max(0, depositPct))) / 100) : depositAmount);
  const principal = Math.max(0, price - deposit);
  const rateNum = Math.min(40, Math.max(0, Number(rate.replace(",", ".")) || 0));
  const rateInvalid = rate.trim() === "" || Number.isNaN(Number(rate.replace(",", "."))) || Number(rate.replace(",", ".")) > 40;

  const base = useMemo(() => scheduledSummary({ principal, annualRatePct: rateNum, years }), [principal, rateNum, years]);
  const boosted = useMemo(() => (extra > 0 ? withExtraPayment({ principal, annualRatePct: rateNum, years }, extra) : null), [principal, rateNum, years, extra]);
  const monthsSaved = boosted ? base.months - boosted.months : 0;

  return (
    <div className={`grid gap-8 ${compact ? "" : "lg:grid-cols-[1.1fr_1fr] lg:gap-12"}`}>
      <div className="grid gap-5">
        <div>
          <label htmlFor={`${id}-price`} className="label">
            Purchase price
          </label>
          <MoneyInput id={`${id}-price`} label="Purchase price in rand" value={price} onChange={setPrice} />
        </div>

        <fieldset>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <legend className="label mb-0">Deposit</legend>
            <div className="inline-flex rounded-full bg-sand p-0.5 text-xs font-semibold" role="group" aria-label="Enter deposit as">
              {(
                [
                  ["pct", "%"],
                  ["amount", "Rand"],
                ] as const
              ).map(([m, l]) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={depositMode === m}
                  onClick={() => {
                    if (m === "amount") setDepositAmount(deposit);
                    else setDepositPct(price ? Math.round((deposit / price) * 1000) / 10 : 0);
                    setDepositMode(m);
                  }}
                  className="rounded-full px-3 py-1 aria-pressed:bg-ink aria-pressed:text-white"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {depositMode === "pct" ? (
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={depositPct}
                onChange={(e) => setDepositPct(Number(e.target.value))}
                aria-label="Deposit percentage"
                aria-valuetext={`${depositPct}% (${formatZar(deposit)})`}
                className="w-full accent-red-ink"
              />
              <span className="w-28 shrink-0 text-right text-sm">
                <strong>{depositPct}%</strong> <span className="text-stone">· {formatZar(deposit)}</span>
              </span>
            </div>
          ) : (
            <MoneyInput id={`${id}-deposit`} label="Deposit amount in rand" value={depositAmount} onChange={setDepositAmount} />
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-rate`} className="label">
              Interest rate (% a year)
            </label>
            <input
              id={`${id}-rate`}
              inputMode="decimal"
              className="input"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              aria-invalid={rateInvalid || undefined}
              aria-describedby={`${id}-rate-note`}
            />
          </div>
          <div>
            <label htmlFor={`${id}-term`} className="label">
              Loan term
            </label>
            <select id={`${id}-term`} className="select" value={years} onChange={(e) => setYears(Number(e.target.value))}>
              {LOAN_TERM_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y} years
                </option>
              ))}
            </select>
          </div>
        </div>
        <p id={`${id}-rate-note`} className="hint -mt-2">
          The default {CALCULATOR_DEFAULTS.annualRatePct}% is an illustrative assumption, not a current market rate or a rate offered by any bank. Enter the rate you have been quoted.
        </p>

        <div>
          <label htmlFor={`${id}-extra`} className="label">
            Extra monthly repayment <span className="font-normal text-stone">(optional)</span>
          </label>
          <MoneyInput id={`${id}-extra`} label="Extra monthly repayment in rand" value={extra} onChange={setExtra} />
        </div>
      </div>

      <div className="on-dark self-start rounded-3xl bg-ink p-6 text-white sm:p-8" aria-live="polite">
        <p className="text-sm uppercase tracking-[0.16em] text-mist">Estimated monthly repayment</p>
        <output htmlFor={`${id}-price ${id}-rate ${id}-term`} className="display mt-2 block text-6xl sm:text-7xl">
          {rateInvalid ? "—" : formatZar(Math.round(base.monthlyRepayment))}
        </output>
        {rateInvalid && <p className="mt-2 text-sm text-[#ff6b62]">Enter an interest rate between 0 and 40%.</p>}
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 text-sm">
          <div>
            <dt className="text-mist">Loan amount</dt>
            <dd className="mt-1 text-lg font-semibold">{formatZar(principal)}</dd>
          </div>
          <div>
            <dt className="text-mist">Deposit</dt>
            <dd className="mt-1 text-lg font-semibold">{formatZar(deposit)}</dd>
          </div>
          <div>
            <dt className="text-mist">Total of repayments</dt>
            <dd className="mt-1 text-lg font-semibold">{rateInvalid ? "—" : formatZar(Math.round(base.totalRepaid))}</dd>
          </div>
          <div>
            <dt className="text-mist">Total interest</dt>
            <dd className="mt-1 text-lg font-semibold">{rateInvalid ? "—" : formatZar(Math.round(base.totalInterest))}</dd>
          </div>
        </dl>
        {boosted && !rateInvalid && principal > 0 && (
          <div className="mt-6 rounded-2xl bg-white/[0.06] p-5 text-sm">
            <p className="font-semibold">With {formatZar(extra)} extra each month</p>
            <p className="mt-1 text-mist">
              You would pay {formatZar(Math.round(boosted.monthlyRepayment))} a month. The loan would be repaid in about{" "}
              <strong className="text-white">
                {Math.floor(boosted.months / 12)} years {boosted.months % 12} months
              </strong>
              {monthsSaved > 0 && <> ({Math.floor(monthsSaved / 12)} years {monthsSaved % 12} months sooner)</>}, saving about{" "}
              <strong className="text-white">{formatZar(Math.round(base.totalInterest - boosted.totalInterest))}</strong> in interest.
            </p>
          </div>
        )}
        <p className="mt-6 text-xs leading-relaxed text-mist">
          This is an estimate for illustration only and not financial advice or a quote. It assumes a fixed rate, monthly compounding and repayments
          made monthly, with any extra repayment paid from the first month. It excludes bank fees, insurance, bond registration and transfer costs.
          Your actual rate and approval depend on the lender and your circumstances.
        </p>
      </div>
    </div>
  );
}
