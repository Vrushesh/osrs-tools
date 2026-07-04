import { describe, expect, it } from "vitest";
import { getNatureRunePrice, normalizeRows } from "../../lib/osrs/normalize";
import type {
  FiveMinutePrice,
  LatestPrice,
  MappingItem,
} from "../../lib/osrs/types";

describe("normalizeRows", () => {
  const mapping: MappingItem[] = [
    {
      id: 1127,
      name: "Rune platebody",
      icon: "Rune platebody.png",
      members: false,
      highalch: 39000,
      limit: 70,
    },
    {
      id: 999,
      name: "No alch item",
      icon: "No alch item.png",
      members: true,
    },
  ];

  const latest: Record<string, LatestPrice> = {
    "1127": {
      low: 38200,
      lowTime: 1_800_000_000,
      high: 38300,
      highTime: 1_800_000_010,
    },
  };

  const fiveMinute: Record<string, FiveMinutePrice> = {
    "1127": { avgLowPrice: 38100, lowPriceVolume: 42 },
  };

  it("joins mapping, latest, and five-minute data", () => {
    expect(normalizeRows(mapping, latest, fiveMinute)).toEqual([
      {
        id: 1127,
        name: "Rune platebody",
        icon: "Rune platebody.png",
        members: false,
        highalch: 39000,
        limit: 70,
        recentBuyPrice: 38200,
        recentBuyTime: 1_800_000_000,
        stableBuyPrice: 38100,
        stableLowVolume: 42,
      },
    ]);
  });

  it("extracts the nature rune active buy price from latest low", () => {
    expect(
      getNatureRunePrice({
        "561": { low: 127, lowTime: 1_800_000_000 },
      }),
    ).toEqual({ price: 127, time: 1_800_000_000 });
  });

  it("returns null when nature rune latest low is unavailable", () => {
    expect(getNatureRunePrice({ "561": { high: 130 } })).toEqual({
      price: null,
      time: null,
    });
  });
});
