import { describe, expect, it } from "vitest";
import {
  calculatePotentialProfit,
  calculateProfit,
  calculateRoi,
  getFreshness,
} from "../../lib/osrs/calculate";

describe("high alch calculations", () => {
  it("calculates profit after buy price and nature rune cost", () => {
    expect(calculateProfit(39000, 38200, 105)).toBe(695);
  });

  it("calculates ROI against total input cost", () => {
    expect(calculateRoi(695, 38200, 105)).toBeCloseTo(0.01814, 5);
  });

  it("calculates potential profit when limit exists", () => {
    expect(calculatePotentialProfit(695, 70)).toBe(48650);
  });

  it("returns null potential profit when limit is missing", () => {
    expect(calculatePotentialProfit(695, undefined)).toBeNull();
  });

  it("labels row freshness", () => {
    const now = 1_800_000_000;

    expect(getFreshness(now - 60, now).label).toBe("Fresh");
    expect(getFreshness(now - 600, now).label).toBe("Aging");
    expect(getFreshness(now - 3600, now).label).toBe("Stale");
    expect(getFreshness(undefined, now).label).toBe("No recent buy price");
  });
});
