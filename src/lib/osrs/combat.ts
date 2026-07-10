export type CombatSkill =
  | "attack"
  | "strength"
  | "defence"
  | "hitpoints"
  | "ranged"
  | "magic"
  | "prayer";

export type CombatStats = Record<CombatSkill, number>;

export type CombatUpgradeHint = {
  skill: CombatSkill;
  levelsNeeded: number;
  resultingLevel: number;
};

const COMBAT_SKILLS: CombatSkill[] = [
  "attack",
  "strength",
  "defence",
  "hitpoints",
  "ranged",
  "magic",
  "prayer",
];

export function calculateCombatLevel(stats: CombatStats) {
  const safeStats = normalizeCombatStats(stats);
  const base =
    0.25 *
    (safeStats.defence + safeStats.hitpoints + Math.floor(safeStats.prayer / 2));
  const melee = 0.325 * (safeStats.attack + safeStats.strength);
  const ranged = 0.325 * (Math.floor(safeStats.ranged / 2) + safeStats.ranged);
  const magic = 0.325 * (Math.floor(safeStats.magic / 2) + safeStats.magic);

  return Math.floor(base + Math.max(melee, ranged, magic));
}

export function getCombatUpgradeHints(stats: CombatStats) {
  const currentLevel = calculateCombatLevel(stats);
  const nextLevel = Math.min(126, currentLevel + 1);

  if (currentLevel >= 126) {
    return {
      currentLevel,
      nextLevel: 126,
      upgrades: [] as CombatUpgradeHint[],
    };
  }

  const upgrades = COMBAT_SKILLS.flatMap((skill) => {
    for (let levelsNeeded = 1; levelsNeeded <= 99 - stats[skill]; levelsNeeded += 1) {
      const candidate = {
        ...stats,
        [skill]: stats[skill] + levelsNeeded,
      };
      const resultingLevel = calculateCombatLevel(candidate);
      if (resultingLevel >= nextLevel) {
        return [{ skill, levelsNeeded, resultingLevel }];
      }
    }

    return [];
  }).sort((a, b) => a.levelsNeeded - b.levelsNeeded || a.skill.localeCompare(b.skill));

  return {
    currentLevel,
    nextLevel,
    upgrades,
  };
}

export function getHighAlchUnlock(magicLevel: number) {
  const safeMagicLevel = clampLevel(magicLevel);
  return {
    unlocked: safeMagicLevel >= 55,
    levelsNeeded: Math.max(0, 55 - safeMagicLevel),
  };
}

export function normalizeCombatStats(stats: CombatStats): CombatStats {
  return {
    attack: clampLevel(stats.attack),
    strength: clampLevel(stats.strength),
    defence: clampLevel(stats.defence),
    hitpoints: clampLevel(stats.hitpoints),
    ranged: clampLevel(stats.ranged),
    magic: clampLevel(stats.magic),
    prayer: clampLevel(stats.prayer),
  };
}

function clampLevel(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, Math.floor(value)));
}
