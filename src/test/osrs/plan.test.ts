import { describe, expect, it } from "vitest";
import { buildAlchPlan, formatAlchPlanShoppingList } from "../../lib/osrs/plan";
import type { EnrichedAlchRow } from "../../lib/osrs/table";

const baseEntry: EnrichedAlchRow = {
  row: {
    id: 1,
    name: "Rune warhammer",
    icon: "Rune warhammer.png",
    members: false,
    highalch: 24900,
    limit: 70,
    recentBuyPrice: 23898,
    recentBuyTime: 1_800_000_000,
    stableBuyPrice: 23900,
    stableLowVolume: 281,
  },
  buyPrice: 23898,
  profit: 874,
  roi: 0.0364,
  potential: 61180,
  freshness: {
    bucket: "fresh",
    label: "<5m",
    ageSeconds: 60,
  },
  lastUpdatedTime: 1_800_000_000,
  volume: 281,
};

describe("alch plan", () => {
  it("defaults item quantities to the GE limit and totals capital, profit, runes, and ROI", () => {
    const plan = buildAlchPlan({
      entries: [baseEntry],
      quantities: {},
      natureRuneCost: 130,
    });

    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({
      id: 1,
      name: "Rune warhammer",
      quantity: 70,
      limit: 70,
      capital: (23898 + 130) * 70,
      profit: 874 * 70,
    });
    expect(plan.totals).toMatchObject({
      itemCount: 1,
      quantity: 70,
      natureRunes: 70,
      capital: (23898 + 130) * 70,
      profit: 874 * 70,
    });
    expect(plan.totals.roi).toBeCloseTo((874 * 70) / ((23898 + 130) * 70), 5);
  });

  it("uses explicit quantities and skips rows without buy price or profit", () => {
    const unavailable: EnrichedAlchRow = {
      ...baseEntry,
      row: { ...baseEntry.row, id: 2, name: "Unavailable item" },
      buyPrice: null,
      profit: null,
    };

    const plan = buildAlchPlan({
      entries: [baseEntry, unavailable],
      quantities: { 1: 12, 2: 4 },
      natureRuneCost: 130,
    });

    expect(plan.items.map((item) => item.name)).toEqual(["Rune warhammer"]);
    expect(plan.totals.quantity).toBe(12);
    expect(plan.totals.capital).toBe((23898 + 130) * 12);
  });

  it("summarizes whether the plan fits inside a cash stack", () => {
    const plan = buildAlchPlan({
      entries: [baseEntry],
      quantities: { 1: 2 },
      natureRuneCost: 130,
      cashStack: 40_000,
    });

    expect(plan.budget).toMatchObject({
      cashStack: 40_000,
      isAffordable: false,
      remainingCash: 0,
      shortfall: (23898 + 130) * 2 - 40_000,
    });
  });

  it("formats a shopping list with items, nature runes, capital, and expected profit", () => {
    const plan = buildAlchPlan({
      entries: [baseEntry],
      quantities: { 1: 2 },
      natureRuneCost: 130,
    });

    expect(formatAlchPlanShoppingList(plan)).toContain("Rune warhammer x2");
    expect(formatAlchPlanShoppingList(plan)).toContain("Nature rune x2");
    expect(formatAlchPlanShoppingList(plan)).toContain("Capital: 48,056 gp");
    expect(formatAlchPlanShoppingList(plan)).toContain("Expected profit: 1,748 gp");
  });
});
