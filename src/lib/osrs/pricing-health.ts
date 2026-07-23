import type { PricingMode } from "./types";

export type FeedStatus = "loading" | "online" | "cached" | "unavailable";

export type PriceFeedHealth = {
  recent: FeedStatus;
  stable: FeedStatus;
};

export type PriceFeedEvent =
  | { type: "success"; stableAvailable: boolean }
  | { type: "failure" };

export const INITIAL_PRICE_FEED_HEALTH: PriceFeedHealth = {
  recent: "loading",
  stable: "loading",
};

export function updatePriceFeedHealth(
  current: PriceFeedHealth,
  event: PriceFeedEvent,
): PriceFeedHealth {
  if (event.type === "success") {
    return {
      recent: "online",
      stable: event.stableAvailable ? "online" : "unavailable",
    };
  }

  return {
    recent: getFailureStatus(current.recent),
    stable: getFailureStatus(current.stable),
  };
}

export function reconcilePricingMode(
  pricingMode: PricingMode,
  stableStatus: FeedStatus,
): PricingMode {
  return pricingMode === "stable" && stableStatus === "unavailable"
    ? "recent"
    : pricingMode;
}

export function getFeedStatusLabel(status: FeedStatus) {
  switch (status) {
    case "loading":
      return "Loading";
    case "online":
      return "Live";
    case "cached":
      return "Cached";
    case "unavailable":
      return "Unavailable";
  }
}

function getFailureStatus(current: FeedStatus): FeedStatus {
  return current === "online" || current === "cached"
    ? "cached"
    : "unavailable";
}
