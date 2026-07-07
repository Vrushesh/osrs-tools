import {
  calculatePotentialProfit,
  calculateProfit,
  calculateRoi,
  getFreshness,
} from "./calculate";
import type { AlchRow, Freshness, PricingMode } from "./types";

export type SortKey =
  | "item"
  | "buy"
  | "highalch"
  | "profit"
  | "lastUpdated"
  | "volume";

export type SortDirection = "asc" | "desc";

export type SortState = {
  key: SortKey;
  direction: SortDirection;
};

export type RowFilters = {
  search: string;
  includeMembers: boolean;
  profitableOnly: boolean;
  hideStale: boolean;
  minProfit: number | null;
  maxProfit: number | null;
  minLimit: number | null;
  minVolume: number | null;
};

export type EnrichedAlchRow = {
  row: AlchRow;
  buyPrice: number | null;
  profit: number | null;
  roi: number | null;
  potential: number | null;
  freshness: Freshness;
  lastUpdatedTime: number | null;
  volume: number;
};

export function enrichRows(
  rows: AlchRow[],
  pricingMode: PricingMode,
  natureRuneCost: number,
  nowSeconds: number,
): EnrichedAlchRow[] {
  return rows.map((row) => {
    const buyPrice =
      pricingMode === "recent" ? row.recentBuyPrice : row.stableBuyPrice;
    const profit =
      buyPrice === null
        ? null
        : calculateProfit(row.highalch, buyPrice, natureRuneCost);
    const roi =
      buyPrice === null || profit === null
        ? null
        : calculateRoi(profit, buyPrice, natureRuneCost);
    const potential =
      profit === null ? null : calculatePotentialProfit(profit, row.limit);
    const freshness = getFreshness(row.recentBuyTime, nowSeconds);

    return {
      row,
      buyPrice,
      profit,
      roi,
      potential,
      freshness,
      lastUpdatedTime: row.recentBuyTime,
      volume: row.stableLowVolume,
    };
  });
}

export function filterRows(rows: EnrichedAlchRow[], filters: RowFilters) {
  const query = filters.search.trim().toLowerCase();

  return rows.filter((entry) => {
    if (query && !entry.row.name.toLowerCase().includes(query)) return false;
    if (!filters.includeMembers && entry.row.members) return false;
    if (filters.profitableOnly && (entry.profit === null || entry.profit <= 0)) {
      return false;
    }
    if (
      filters.hideStale &&
      (entry.freshness.bucket === "stale" || entry.freshness.bucket === "unknown")
    ) {
      return false;
    }
    if (filters.minProfit !== null && (entry.profit ?? -Infinity) < filters.minProfit) {
      return false;
    }
    if (filters.maxProfit !== null && (entry.profit ?? Infinity) > filters.maxProfit) {
      return false;
    }
    if (filters.minLimit !== null && (entry.row.limit ?? 0) < filters.minLimit) {
      return false;
    }
    if (filters.minVolume !== null && entry.volume < filters.minVolume) return false;
    return true;
  });
}

export function sortRows(rows: EnrichedAlchRow[], sort: SortState) {
  const direction = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const leftValue = getSortValue(left, sort.key);
    const rightValue = getSortValue(right, sort.key);

    if (leftValue === null || leftValue === undefined) return 1;
    if (rightValue === null || rightValue === undefined) return -1;

    const comparison = compareSortValue(
      leftValue,
      rightValue,
    );
    return comparison * direction;
  });
}

export function paginateRows(
  rows: EnrichedAlchRow[],
  page: number,
  pageSize: number | "all",
) {
  if (pageSize === "all") return rows;

  const start = Math.max(0, page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function formatRelativeTime(
  timestamp: number | null,
  nowSeconds: number,
) {
  if (!timestamp) return "Unavailable";

  const ageSeconds = Math.max(0, nowSeconds - timestamp);
  if (ageSeconds < 60) return `${ageSeconds} ${ageSeconds === 1 ? "second" : "seconds"} ago`;

  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageMinutes < 60) {
    return `${ageMinutes} ${ageMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours < 24) return `${ageHours} ${ageHours === 1 ? "hour" : "hours"} ago`;

  const ageDays = Math.floor(ageHours / 24);
  return `${ageDays} ${ageDays === 1 ? "day" : "days"} ago`;
}

function getSortValue(row: EnrichedAlchRow, key: SortKey) {
  switch (key) {
    case "item":
      return row.row.name;
    case "buy":
      return row.buyPrice;
    case "highalch":
      return row.row.highalch;
    case "profit":
      return row.profit;
    case "lastUpdated":
      return row.lastUpdatedTime;
    case "volume":
      return row.volume;
  }
}

function compareSortValue(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
) {
  if (typeof left === "string" && typeof right === "string") {
    return left.localeCompare(right);
  }

  return Number(left) - Number(right);
}
