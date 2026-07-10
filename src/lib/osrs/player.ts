import {
  calculateCombatLevel,
  getCombatUpgradeHints,
  getHighAlchUnlock,
} from "./combat";
import type { CombatStats } from "./combat";

export type PlayerProfile = {
  username: string;
  displayName: string;
  accountType: string;
  totalLevel: number;
  combatLevel: number;
  stats: CombatStats;
  highAlch: {
    unlocked: boolean;
    levelsNeeded: number;
  };
  nextCombat: ReturnType<typeof getCombatUpgradeHints>;
};

const SKILL_KEYS = [
  "attack",
  "strength",
  "defence",
  "hitpoints",
  "ranged",
  "magic",
  "prayer",
] as const;

export function parseWiseOldManPlayer(payload: unknown): PlayerProfile | null {
  if (!isObject(payload)) return null;

  const skills = getNestedObject(payload, ["latestSnapshot", "data", "skills"]);
  if (!skills) return null;

  const stats = SKILL_KEYS.reduce((current, skill) => {
    const level = getSkillLevel(skills, skill);
    return level === null ? current : { ...current, [skill]: level };
  }, {} as Partial<CombatStats>);

  if (!hasAllCombatStats(stats)) return null;

  const username = getString(payload.username) ?? getString(payload.displayName);
  const displayName = getString(payload.displayName) ?? username;
  if (!username || !displayName) return null;

  const totalLevel = getSkillLevel(skills, "overall") ?? 0;

  return {
    username,
    displayName,
    accountType: getString(payload.type) ?? "unknown",
    totalLevel,
    combatLevel: calculateCombatLevel(stats),
    stats,
    highAlch: getHighAlchUnlock(stats.magic),
    nextCombat: getCombatUpgradeHints(stats),
  };
}

function getSkillLevel(skills: Record<string, unknown>, skill: string) {
  const value = skills[skill];
  if (!isObject(value)) return null;
  const level = value.level;
  return typeof level === "number" && Number.isFinite(level) ? level : null;
}

function getNestedObject(source: Record<string, unknown>, path: string[]) {
  let current: unknown = source;

  for (const segment of path) {
    if (!isObject(current)) return null;
    current = current[segment];
  }

  return isObject(current) ? current : null;
}

function hasAllCombatStats(stats: Partial<CombatStats>): stats is CombatStats {
  return SKILL_KEYS.every((skill) => typeof stats[skill] === "number");
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
