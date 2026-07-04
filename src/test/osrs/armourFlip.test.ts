import { describe, expect, it } from "vitest";
import {
  enrichArmourFlips,
  getAfterTaxSellValue,
} from "../../lib/osrs/armourFlip";
import type { ArmourSetDefinition } from "../../lib/osrs/armourSets";
import type { PriceItem } from "../../lib/osrs/types";

const definition: ArmourSetDefinition = {
  id: "rune-lg",
  name: "Rune armour set (lg)",
  setItem: "Rune armour set (lg)",
  pieces: ["Rune full helm", "Rune platebody", "Rune platelegs", "Rune kiteshield"],
  members: false,
};

describe("getAfterTaxSellValue", () => {
  it("subtracts the 2% GE tax", () => {
    expect(getAfterTaxSellValue(10_000)).toBe(9_800);
  });

  it("caps GE tax at 5m", () => {
    expect(getAfterTaxSellValue(300_000_000)).toBe(295_000_000);
  });
});

describe("enrichArmourFlips", () => {
  it("calculates buy pieces then sell set profit after tax", () => {
    const [row] = enrichArmourFlips(
      [definition],
      fixtureItems(),
      "pieces-to-set",
      "recent",
    );

    expect(row.buyTotal).toBe(90_000);
    expect(row.sellTotal).toBe(120_000);
    expect(row.sellAfterTax).toBe(117_600);
    expect(row.profit).toBe(27_600);
    expect(row.limit).toBe(8);
    expect(row.volume).toBe(50);
    expect(row.missingItems).toEqual([]);
  });

  it("calculates buy set then sell pieces profit after tax per piece", () => {
    const [row] = enrichArmourFlips(
      [definition],
      fixtureItems(),
      "set-to-pieces",
      "recent",
    );

    expect(row.buyTotal).toBe(100_000);
    expect(row.sellTotal).toBe(130_000);
    expect(row.sellAfterTax).toBe(127_400);
    expect(row.profit).toBe(27_400);
    expect(row.volume).toBe(40);
  });

  it("marks missing set members as unavailable", () => {
    const [row] = enrichArmourFlips(
      [definition],
      fixtureItems().filter((item) => item.name !== "Rune platelegs"),
      "pieces-to-set",
      "recent",
    );

    expect(row.buyTotal).toBeNull();
    expect(row.profit).toBeNull();
    expect(row.missingItems).toEqual(["Rune platelegs"]);
  });
});

function fixtureItems(): PriceItem[] {
  return [
    item("Rune armour set (lg)", 100_000, 120_000, 8, 40, 50),
    item("Rune full helm", 20_000, 30_000, 70, 90, 100),
    item("Rune platebody", 30_000, 40_000, 70, 80, 90),
    item("Rune platelegs", 25_000, 35_000, 70, 70, 80),
    item("Rune kiteshield", 15_000, 25_000, 70, 60, 70),
  ];
}

function item(
  name: string,
  low: number,
  high: number,
  limit: number,
  lowVolume: number,
  highVolume: number,
): PriceItem {
  return {
    id: name.length,
    name,
    icon: `${name}.png`,
    members: false,
    limit,
    recentHighPrice: high,
    recentHighTime: 1000,
    recentLowPrice: low,
    recentLowTime: 990,
    stableHighPrice: high,
    stableHighVolume: highVolume,
    stableLowPrice: low,
    stableLowVolume: lowVolume,
  };
}
