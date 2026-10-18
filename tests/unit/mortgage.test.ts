import { describe, expect, it } from "vitest";
import { monthlyRepayment, scheduledSummary, withExtraPayment } from "@/lib/mortgage";

// Reference values computed independently with Python's Decimal (40-digit
// precision) and cross-checked against standard textbook examples.
describe("monthlyRepayment", () => {
  it.each([
    [100_000, 6, 30, 599.55],
    [200_000, 5, 15, 1581.59],
    [1_350_000, 11, 20, 13934.54],
    [1_350_000, 11.75, 20, 14630.05],
    [900_000, 10.5, 30, 8232.65],
  ])("P=%i at %f%% over %i years ≈ R%f", (P, rate, years, expected) => {
    expect(monthlyRepayment({ principal: P, annualRatePct: rate, years })).toBeCloseTo(expected, 2);
  });

  it("handles zero interest as straight-line repayment", () => {
    expect(monthlyRepayment({ principal: 120_000, annualRatePct: 0, years: 10 })).toBe(1000);
  });

  it("returns 0 for a zero or negative principal", () => {
    expect(monthlyRepayment({ principal: 0, annualRatePct: 11, years: 20 })).toBe(0);
    expect(monthlyRepayment({ principal: -5, annualRatePct: 11, years: 20 })).toBe(0);
  });
});

describe("scheduledSummary", () => {
  it("totals repayments and interest", () => {
    const s = scheduledSummary({ principal: 1_350_000, annualRatePct: 11, years: 20 });
    expect(s.months).toBe(240);
    expect(s.totalRepaid).toBeCloseTo(3_344_290.39, 0);
    expect(s.totalInterest).toBeCloseTo(1_994_290.39, 0);
  });
});

describe("withExtraPayment", () => {
  it("matches the scheduled loan when there is no extra payment", () => {
    const base = scheduledSummary({ principal: 900_000, annualRatePct: 10.5, years: 30 });
    const sim = withExtraPayment({ principal: 900_000, annualRatePct: 10.5, years: 30 }, 0);
    expect(sim.months).toBe(360);
    expect(sim.totalRepaid).toBeCloseTo(base.totalRepaid, 0);
  });

  it("shortens the term and reduces interest with R1 000 extra per month", () => {
    const sim = withExtraPayment({ principal: 1_350_000, annualRatePct: 11, years: 20 }, 1000);
    expect(sim.months).toBe(194);
    expect(sim.totalRepaid).toBeCloseTo(2_886_867.04, 0);
    expect(sim.totalInterest).toBeCloseTo(1_536_867.04, 0);
  });

  it("settles a zero-interest loan early with extra payments", () => {
    const sim = withExtraPayment({ principal: 120_000, annualRatePct: 0, years: 10 }, 1000);
    expect(sim.months).toBe(60);
    expect(sim.totalInterest).toBeCloseTo(0, 6);
  });
});
