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
  source: "wise-old-man" | "official-hiscores";
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

const HISCORES_SKILL_ORDER = [
  "overall",
  "attack",
  "defence",
  "strength",
  "hitpoints",
  "ranged",
  "prayer",
  "magic",
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
    source: "wise-old-man",
    totalLevel,
    combatLevel: calculateCombatLevel(stats),
    stats,
    highAlch: getHighAlchUnlock(stats.magic),
    nextCombat: getCombatUpgradeHints(stats),
  };
}

export function parseHiscoresPlayer(username: string, payload: string): PlayerProfile | null {
  const rows = payload
    .trim()
    .split("\n")
    .map((line) => line.trim().split(","));

  if (rows.length < HISCORES_SKILL_ORDER.length) return null;

  const levels = new Map<string, number>();
  for (const [index, skill] of HISCORES_SKILL_ORDER.entries()) {
    const level = Number(rows[index]?.[1]);
    if (!Number.isFinite(level) || level < 1) return null;
    levels.set(skill, level);
  }

  const stats = {
    attack: levels.get("attack"),
    strength: levels.get("strength"),
    defence: levels.get("defence"),
    hitpoints: levels.get("hitpoints"),
    ranged: levels.get("ranged"),
    magic: levels.get("magic"),
    prayer: levels.get("prayer"),
  };

  if (!hasAllCombatStats(stats)) return null;

  const displayName = username.trim();

  return {
    username: displayName,
    displayName,
    accountType: "regular",
    source: "official-hiscores",
    totalLevel: levels.get("overall") ?? 0,
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
