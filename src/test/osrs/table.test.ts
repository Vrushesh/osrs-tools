import { describe, expect, it } from "vitest";
import {
  enrichRows,
  filterRows,
  formatRelativeTime,
  paginateRows,
  sortRows,
} from "../../lib/osrs/table";
import type { AlchRow } from "../../lib/osrs/types";

const rows: AlchRow[] = [
  {
    id: 1,
    name: "Ballista limbs",
    icon: "Ballista limbs.png",
    members: true,
    highalch: 30000,
    limit: 8,
    recentBuyPrice: 25000,
    recentBuyTime: 1_800_000_000 - 20 * 60,
    stableBuyPrice: 25200,
    stableLowVolume: 1,
  },
  {
    id: 2,
    name: "Red d'hide body",
    icon: "Red d'hide body.png",
    members: false,
    highalch: 6738,
    limit: 70,
    recentBuyPrice: 4850,
    recentBuyTime: 1_800_000_000 - 2 * 60,
    stableBuyPrice: 4900,
    stableLowVolume: 71,
  },
  {
    id: 3,
    name: "Stale item",
    icon: "Stale item.png",
    members: false,
    highalch: 1000,
    limit: 5,
    recentBuyPrice: 900,
    recentBuyTime: 1_800_000_000 - 2 * 60 * 60,
    stableBuyPrice: null,
    stableLowVolume: 0,
  },
];

describe("table helpers", () => {
  it("enriches rows with selected buy price and profit", () => {
    const [row] = enrichRows(rows, "recent", 127, 1_800_000_000);

    expect(row.buyPrice).toBe(25000);
    expect(row.profit).toBe(4873);
    expect(row.lastUpdatedTime).toBe(1_800_000_000 - 20 * 60);
  });

  it("filters by search, membership, profit, limit, and volume", () => {
    const enriched = enrichRows(rows, "recent", 127, 1_800_000_000);

    expect(
      filterRows(enriched, {
        search: "body",
        includeMembers: false,
        profitableOnly: true,
        hideStale: false,
        minProfit: null,
        maxProfit: null,
        minLimit: 50,
        minVolume: 10,
      }).map((row) => row.row.name),
    ).toEqual(["Red d'hide body"]);
  });

  it("can hide stale rows from the useful list", () => {
    const enriched = enrichRows(rows, "recent", 127, 1_800_000_000);

    expect(
      filterRows(enriched, {
        search: "",
        includeMembers: true,
        profitableOnly: false,
        hideStale: true,
        minProfit: null,
        maxProfit: null,
        minLimit: null,
        minVolume: null,
      }).map((row) => row.row.name),
    ).toEqual(["Ballista limbs", "Red d'hide body"]);
  });

  it("keeps the default useful list to profitable rows with limit and volume", () => {
    const enriched = enrichRows(
      [
        ...rows,
        {
          id: 4,
          name: "No limit profitable item",
          icon: "No limit profitable item.png",
          members: false,
          highalch: 2000,
          recentBuyPrice: 1000,
          recentBuyTime: 1_800_000_000,
          stableBuyPrice: 1000,
          stableLowVolume: 20,
        },
        {
          id: 5,
          name: "No volume profitable item",
          icon: "No volume profitable item.png",
          members: false,
          highalch: 2000,
          limit: 10,
          recentBuyPrice: 1000,
          recentBuyTime: 1_800_000_000,
          stableBuyPrice: 1000,
          stableLowVolume: 0,
        },
      ],
      "recent",
      127,
      1_800_000_000,
    );

    expect(
      filterRows(enriched, {
        search: "",
        includeMembers: true,
        profitableOnly: false,
        hideStale: false,
        minProfit: 1,
        maxProfit: null,
        minLimit: 1,
        minVolume: 1,
      }).map((row) => row.row.name),
    ).toEqual(["Ballista limbs", "Red d'hide body"]);
  });

  it("sorts rows by last updated ascending", () => {
    const enriched = enrichRows(rows, "recent", 127, 1_800_000_000);

    expect(
      sortRows(enriched, { key: "lastUpdated", direction: "asc" }).map(
        (row) => row.row.name,
      ),
    ).toEqual(["Stale item", "Ballista limbs", "Red d'hide body"]);
  });

  it("keeps unavailable profit rows below priced rows when sorting descending", () => {
    const enriched = enrichRows(
      [
        ...rows,
        {
          id: 4,
          name: "Unavailable item",
          icon: "Unavailable item.png",
          members: false,
          highalch: 10000,
          limit: 10,
          recentBuyPrice: null,
          recentBuyTime: null,
          stableBuyPrice: null,
          stableLowVolume: 0,
        },
      ],
      "recent",
      127,
      1_800_000_000,
    );

    const sorted = sortRows(enriched, { key: "profit", direction: "desc" });

    expect(sorted.at(-1)?.row.name).toBe("Unavailable item");
  });

  it("paginates rows by page and page size", () => {
    const enriched = enrichRows(rows, "recent", 127, 1_800_000_000);

    expect(paginateRows(enriched, 2, 2).map((row) => row.row.name)).toEqual([
      "Stale item",
    ]);
  });

  it("formats relative update times", () => {
    const now = 1_800_000_000;

    expect(formatRelativeTime(now - 20, now)).toBe("20 seconds ago");
    expect(formatRelativeTime(now - 20 * 60, now)).toBe("20 minutes ago");
    expect(formatRelativeTime(now - 12 * 60 * 60, now)).toBe("12 hours ago");
    expect(formatRelativeTime(now - 25 * 60 * 60, now)).toBe("1 day ago");
    expect(formatRelativeTime(null, now)).toBe("Unavailable");
  });
});
