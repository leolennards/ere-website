/**
 * Home-loan repayment maths (standard amortising loan, monthly compounding).
 *
 *   M = P·r·(1+r)^n / ((1+r)^n − 1),  r = annual rate / 12,  n = years × 12
 *
 * Assumptions (shown to users on the calculator page):
 * - Interest is calculated monthly on the outstanding balance at a fixed rate.
 * - Any extra repayment is paid together with every instalment from month 1
 *   and reduces the capital immediately.
 * - Bank fees, insurance, bond registration and transfer costs are excluded.
 */

export interface LoanInput {
  principal: number;
  annualRatePct: number;
  years: number;
}

export function monthlyRepayment({ principal, annualRatePct, years }: LoanInput): number {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

export interface RepaymentSummary {
  principal: number;
  monthlyRepayment: number;
  months: number;
  totalRepaid: number;
  totalInterest: number;
}

export function scheduledSummary(input: LoanInput): RepaymentSummary {
  const months = Math.round(input.years * 12);
  const m = monthlyRepayment(input);
  const totalRepaid = m * months;
  return {
    principal: Math.max(0, input.principal),
    monthlyRepayment: m,
    months: input.principal > 0 ? months : 0,
    totalRepaid: input.principal > 0 ? totalRepaid : 0,
    totalInterest: input.principal > 0 ? totalRepaid - input.principal : 0,
  };
}

/**
 * Simulates the loan month by month with an additional fixed monthly payment.
 * The final instalment is reduced to whatever settles the balance.
 */
export function withExtraPayment(input: LoanInput, extraMonthly: number): RepaymentSummary {
  const base = monthlyRepayment(input);
  const r = input.annualRatePct / 100 / 12;
  const maxMonths = Math.round(input.years * 12);
  let balance = input.principal;
  let totalRepaid = 0;
  let months = 0;
  const payment = base + Math.max(0, extraMonthly);
  while (balance > 0.005 && months < maxMonths) {
    const interest = balance * r;
    const due = balance + interest;
    const paid = Math.min(payment, due);
    balance = due - paid;
    totalRepaid += paid;
    months++;
  }
  return {
    principal: Math.max(0, input.principal),
    monthlyRepayment: payment,
    months: input.principal > 0 ? months : 0,
    totalRepaid: input.principal > 0 ? totalRepaid : 0,
    totalInterest: input.principal > 0 ? totalRepaid - input.principal : 0,
  };
}

export const LOAN_TERM_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

/** Illustrative defaults only — never presented as a current or offered rate. */
export const CALCULATOR_DEFAULTS = {
  price: 1_500_000,
  depositPct: 10,
  annualRatePct: 11,
  years: 20,
  extraMonthly: 0,
} as const;
