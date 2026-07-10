"use client";

import { useMemo, useState } from "react";
import {
  calculateCombatLevel,
  getCombatUpgradeHints,
  getHighAlchUnlock,
} from "@/lib/osrs/combat";
import type { CombatSkill, CombatStats } from "@/lib/osrs/combat";
import type { PlayerProfile } from "@/lib/osrs/player";

const COMBAT_SKILLS: Array<{ key: CombatSkill; label: string }> = [
  { key: "attack", label: "Attack" },
  { key: "strength", label: "Strength" },
  { key: "defence", label: "Defence" },
  { key: "hitpoints", label: "Hitpoints" },
  { key: "ranged", label: "Ranged" },
  { key: "magic", label: "Magic" },
  { key: "prayer", label: "Prayer" },
];

const DEFAULT_STATS: CombatStats = {
  attack: 1,
  strength: 1,
  defence: 1,
  hitpoints: 10,
  ranged: 1,
  magic: 1,
  prayer: 1,
};

type LookupResponse = {
  player?: PlayerProfile;
  error?: string;
};

export function PlayerLookup() {
  const [username, setUsername] = useState("");
  const [loadedPlayer, setLoadedPlayer] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<CombatStats>(DEFAULT_STATS);
  const [status, setStatus] = useState("Use Wise Old Man or edit stats manually.");
  const [isLoading, setIsLoading] = useState(false);

  const combatLevel = useMemo(() => calculateCombatLevel(stats), [stats]);
  const nextCombat = useMemo(() => getCombatUpgradeHints(stats), [stats]);
  const highAlch = useMemo(() => getHighAlchUnlock(stats.magic), [stats.magic]);

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setStatus("Enter an OSRS username first.");
      return;
    }

    setIsLoading(true);
    setStatus("Looking up Wise Old Man...");

    try {
      const response = await fetch(
        `/api/player?username=${encodeURIComponent(trimmedUsername)}`,
      );
      const payload = (await response.json()) as LookupResponse;

      if (!response.ok || !payload.player) {
        setLoadedPlayer(null);
        setStatus(payload.error ?? "Player lookup failed. Manual stats still work.");
        return;
      }

      setLoadedPlayer(payload.player);
      setStats(payload.player.stats);
      setStatus("Stats loaded from Wise Old Man.");
    } catch {
      setLoadedPlayer(null);
      setStatus("Player lookup failed. Manual stats still work.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleStatChange(skill: CombatSkill, value: string) {
    const parsed = Number(value);
    setLoadedPlayer(null);
    setStats((current) => ({
      ...current,
      [skill]: Number.isFinite(parsed) ? parsed : 1,
    }));
  }

  const bestUpgrades = nextCombat.upgrades.slice(0, 3);

  return (
    <section className="playerPanel" aria-label="Player lookup and combat calculator">
      <div className="playerPanelHeader">
        <div>
          <h2>Player Lookup</h2>
          <p>Fetch WOM stats or edit combat levels.</p>
        </div>
        <div className="combatSummary">
          <span>Combat</span>
          <strong>{combatLevel}</strong>
        </div>
      </div>

      <form className="playerLookupForm" onSubmit={handleLookup}>
        <label>
          RSN
          <input
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <button disabled={isLoading} type="submit">
          {isLoading ? "Looking up..." : "Load stats"}
        </button>
        <span>{status}</span>
      </form>

      <div className="playerInsights">
        <div>
          <span>Profile</span>
          <strong>{loadedPlayer ? loadedPlayer.displayName : "Manual stats"}</strong>
          <small>
            {loadedPlayer
              ? `${loadedPlayer.accountType} · total ${loadedPlayer.totalLevel.toLocaleString()}`
              : "Not linked to a player"}
          </small>
        </div>
        <div>
          <span>High Alch</span>
          <strong>{highAlch.unlocked ? "Unlocked" : `Need ${highAlch.levelsNeeded}`}</strong>
          <small>Requires 55 Magic</small>
        </div>
        <div>
          <span>Next combat</span>
          <strong>{nextCombat.nextLevel}</strong>
          <small>
            {bestUpgrades.length
              ? bestUpgrades
                  .map((upgrade) => `${formatSkill(upgrade.skill)} +${upgrade.levelsNeeded}`)
                  .join(" · ")
              : "Max combat reached"}
          </small>
        </div>
      </div>

      <div className="statGrid">
        {COMBAT_SKILLS.map((skill) => (
          <label key={skill.key}>
            {skill.label}
            <input
              max="99"
              min="1"
              type="number"
              value={stats[skill.key]}
              onChange={(event) => handleStatChange(skill.key, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function formatSkill(skill: CombatSkill) {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}
