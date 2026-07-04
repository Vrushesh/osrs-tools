import type {
  AlchRow,
  FiveMinutePrice,
  LatestPrice,
  MappingItem,
} from "./types";

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
