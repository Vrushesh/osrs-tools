import type { Freshness } from "./types";

export function calculateProfit(
  highAlch: number,
  buyPrice: number,
  natureRuneCost: number,
) {
  return highAlch - buyPrice - natureRuneCost;
}

export function calculateRoi(
  profit: number,
  buyPrice: number,
  natureRuneCost: number,
) {
  const inputCost = buyPrice + natureRuneCost;
  if (inputCost <= 0) return 0;
  return profit / inputCost;
}

export function calculatePotentialProfit(
  profit: number,
  limit: number | undefined,
) {
  if (typeof limit !== "number") return null;
  return profit * limit;
}

export function getFreshness(
  tradeTime: number | null | undefined,
  nowSeconds: number,
): Freshness {
  if (!tradeTime) {
    return { bucket: "unknown", label: "No trade", ageSeconds: null };
  }

  const ageSeconds = Math.max(0, nowSeconds - tradeTime);

  if (ageSeconds < 5 * 60) {
    return { bucket: "fresh", label: "<5m", ageSeconds };
  }

  if (ageSeconds < 15 * 60) {
    return { bucket: "recent", label: "5-15m", ageSeconds };
  }

  if (ageSeconds <= 30 * 60) {
    return { bucket: "aging", label: "15-30m", ageSeconds };
  }

  return { bucket: "stale", label: ">30m", ageSeconds };
}
