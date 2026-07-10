import { describe, expect, it } from "vitest";
import { parseHiscoresPlayer, parseWiseOldManPlayer } from "../../lib/osrs/player";

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
      source: "wise-old-man",
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

describe("Official hiscores player parsing", () => {
  it("extracts combat stats from the index_lite response", () => {
    const player = parseHiscoresPlayer(
      "AomineKun",
      [
        "931102,1800,51609971",
        "1115621,83,2798698",
        "1025692,83,2700241",
        "1171234,82,2560000",
        "923456,87,4000000",
        "1000000,75,1210421",
        "800000,70,737627",
        "900000,80,1986068",
      ].join("\n"),
    );

    expect(player).toMatchObject({
      displayName: "AomineKun",
      username: "AomineKun",
      accountType: "regular",
      source: "official-hiscores",
      totalLevel: 1800,
      stats: {
        attack: 83,
        strength: 82,
        defence: 83,
        hitpoints: 87,
        ranged: 75,
        magic: 80,
        prayer: 70,
      },
    });
  });

  it("returns null for malformed hiscores payloads", () => {
    expect(parseHiscoresPlayer("Bad payload", "<html>not csv</html>")).toBeNull();
  });
});
