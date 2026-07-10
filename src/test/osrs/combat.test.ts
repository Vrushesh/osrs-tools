import { describe, expect, it } from "vitest";
import {
  calculateCombatLevel,
  getCombatUpgradeHints,
  getHighAlchUnlock,
} from "../../lib/osrs/combat";

describe("combat calculations", () => {
  it("calculates OSRS combat level from combat stats", () => {
    expect(
      calculateCombatLevel({
        attack: 99,
        strength: 99,
        defence: 99,
        hitpoints: 99,
        ranged: 99,
        magic: 99,
        prayer: 99,
      }),
    ).toBe(126);

    expect(
      calculateCombatLevel({
        attack: 1,
        strength: 1,
        defence: 1,
        hitpoints: 10,
        ranged: 1,
        magic: 1,
        prayer: 1,
      }),
    ).toBe(3);
  });

  it("finds which one-level upgrades increase combat level", () => {
    const hints = getCombatUpgradeHints({
      attack: 39,
      strength: 40,
      defence: 40,
      hitpoints: 40,
      ranged: 1,
      magic: 1,
      prayer: 1,
    });

    expect(hints.currentLevel).toBe(45);
    expect(hints.nextLevel).toBe(46);
    expect(hints.upgrades.some((upgrade) => upgrade.skill === "attack")).toBe(true);
    expect(hints.upgrades.every((upgrade) => upgrade.levelsNeeded > 0)).toBe(true);
  });

  it("summarizes high alch unlock status", () => {
    expect(getHighAlchUnlock(54)).toEqual({
      unlocked: false,
      levelsNeeded: 1,
    });
    expect(getHighAlchUnlock(55)).toEqual({
      unlocked: true,
      levelsNeeded: 0,
    });
  });
});
