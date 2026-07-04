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
    return { label: "No recent buy price", ageSeconds: null };
  }

  const ageSeconds = Math.max(0, nowSeconds - tradeTime);

  if (ageSeconds < 5 * 60) {
    return { label: "Fresh", ageSeconds };
  }

  if (ageSeconds <= 30 * 60) {
    return { label: "Aging", ageSeconds };
  }

  return { label: "Stale", ageSeconds };
}
