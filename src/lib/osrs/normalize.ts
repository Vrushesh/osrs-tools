import type {
  AlchRow,
  FiveMinutePrice,
  LatestPrice,
  MappingItem,
} from "./types";

const NATURE_RUNE_ID = "561";

export function normalizeRows(
  mapping: MappingItem[],
  latest: Record<string, LatestPrice>,
  fiveMinute: Record<string, FiveMinutePrice>,
): AlchRow[] {
  return mapping
    .filter((item) => typeof item.highalch === "number")
    .map((item) => {
      const recent = latest[String(item.id)];
      const stable = fiveMinute[String(item.id)];

      return {
        id: item.id,
        name: item.name,
        icon: item.icon,
        members: item.members,
        highalch: item.highalch as number,
        limit: item.limit,
        recentBuyPrice: recent?.low ?? null,
        recentBuyTime: recent?.lowTime ?? null,
        stableBuyPrice: stable?.avgLowPrice ?? null,
        stableLowVolume: stable?.lowPriceVolume ?? 0,
      };
    });
}

export function getNatureRunePrice(latest: Record<string, LatestPrice>) {
  const natureRune = latest[NATURE_RUNE_ID];

  return {
    price: natureRune?.low ?? null,
    time: natureRune?.lowTime ?? null,
  };
}
