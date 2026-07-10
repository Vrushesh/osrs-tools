import { describe, expect, it } from "vitest";
import { parseWiseOldManPlayer } from "../../lib/osrs/player";

describe("Wise Old Man player parsing", () => {
  it("extracts combat stats from the latest snapshot", () => {
    const player = parseWiseOldManPlayer({
      username: "zezima",
      displayName: "Zezima",
      type: "regular",
      latestSnapshot: {
        data: {
          skills: {
            attack: { level: 99 },
            strength: { level: 99 },
            defence: { level: 99 },
            hitpoints: { level: 99 },
            ranged: { level: 99 },
            magic: { level: 99 },
            prayer: { level: 99 },
            overall: { level: 2277 },
          },
        },
      },
    });

    expect(player).toMatchObject({
      displayName: "Zezima",
      username: "zezima",
      accountType: "regular",
      totalLevel: 2277,
      combatLevel: 126,
      stats: {
        attack: 99,
        strength: 99,
        defence: 99,
        hitpoints: 99,
        ranged: 99,
        magic: 99,
        prayer: 99,
      },
    });
  });

  it("returns null for malformed player payloads", () => {
    expect(parseWiseOldManPlayer({ displayName: "Bad payload" })).toBeNull();
  });
});
