import { describe, expect, it } from "vitest";
import {
  parseStoredAlchPlan,
  pruneStoredAlchPlan,
  serializeStoredAlchPlan,
} from "../../lib/osrs/plan-storage";

describe("alch plan storage", () => {
  it("returns an empty plan for missing or malformed storage", () => {
    expect(parseStoredAlchPlan(null)).toEqual({
      itemIds: [],
      quantities: {},
      cashStack: "",
    });
    expect(parseStoredAlchPlan("not json")).toEqual({
      itemIds: [],
      quantities: {},
      cashStack: "",
    });
  });

  it("deduplicates item ids and keeps valid quantities for selected items", () => {
    const raw = JSON.stringify({
      itemIds: [4151, 2, 4151, 0, -4, 3.5, "11840"],
      quantities: {
        2: 12.9,
        4151: 70,
        11840: 4,
        999: 20,
      },
      cashStack: "2500000",
    });

    expect(parseStoredAlchPlan(raw)).toEqual({
      itemIds: [4151, 2, 11840],
      quantities: {
        2: 12,
        4151: 70,
        11840: 4,
      },
      cashStack: "2500000",
    });
  });

  it("drops unsafe quantities and cash stack values", () => {
    const raw = JSON.stringify({
      itemIds: [1, 2, 3, 4, 5],
      quantities: {
        1: -1,
        2: null,
        3: "50",
        4: 25,
        5: 0,
      },
      cashStack: "-500",
    });

    expect(parseStoredAlchPlan(raw)).toEqual({
      itemIds: [1, 2, 3, 4, 5],
      quantities: { 4: 25 },
      cashStack: "",
    });
  });

  it("serializes a normalized plan that safely round-trips", () => {
    const serialized = serializeStoredAlchPlan({
      itemIds: [3, 3, 1],
      quantities: { 1: 8, 3: 40.8, 9: 12 },
      cashStack: "1000000",
    });

    expect(parseStoredAlchPlan(serialized)).toEqual({
      itemIds: [3, 1],
      quantities: { 1: 8, 3: 40 },
      cashStack: "1000000",
    });
  });

  it("prunes items that no longer exist while preserving the cash stack", () => {
    expect(
      pruneStoredAlchPlan(
        {
          itemIds: [1, 2, 3],
          quantities: { 1: 10, 2: 20, 3: 30 },
          cashStack: "500000",
        },
        new Set([1, 3]),
      ),
    ).toEqual({
      itemIds: [1, 3],
      quantities: { 1: 10, 3: 30 },
      cashStack: "500000",
    });
  });
});
