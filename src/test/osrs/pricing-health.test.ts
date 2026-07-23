import { describe, expect, it } from "vitest";
import {
  INITIAL_PRICE_FEED_HEALTH,
  getFeedStatusLabel,
  reconcilePricingMode,
  updatePriceFeedHealth,
} from "../../lib/osrs/pricing-health";

describe("pricing feed health", () => {
  it("marks required and stable feeds online after a complete response", () => {
    expect(
      updatePriceFeedHealth(INITIAL_PRICE_FEED_HEALTH, {
        type: "success",
        stableAvailable: true,
      }),
    ).toEqual({ recent: "online", stable: "online" });
  });

  it("keeps recent prices online and marks stable unavailable after a partial response", () => {
    expect(
      updatePriceFeedHealth(INITIAL_PRICE_FEED_HEALTH, {
        type: "success",
        stableAvailable: false,
      }),
    ).toEqual({ recent: "online", stable: "unavailable" });
  });

  it("marks prior successful data cached when a later request fails", () => {
    expect(
      updatePriceFeedHealth(
        { recent: "online", stable: "online" },
        { type: "failure" },
      ),
    ).toEqual({ recent: "cached", stable: "cached" });
  });

  it("does not describe a missing stable feed as cached after a later failure", () => {
    expect(
      updatePriceFeedHealth(
        { recent: "online", stable: "unavailable" },
        { type: "failure" },
      ),
    ).toEqual({ recent: "cached", stable: "unavailable" });
  });

  it("marks feeds unavailable when the first request fails", () => {
    expect(
      updatePriceFeedHealth(INITIAL_PRICE_FEED_HEALTH, { type: "failure" }),
    ).toEqual({ recent: "unavailable", stable: "unavailable" });
  });

  it("falls back from stable pricing only when its feed is unavailable", () => {
    expect(reconcilePricingMode("stable", "unavailable")).toBe("recent");
    expect(reconcilePricingMode("stable", "cached")).toBe("stable");
    expect(reconcilePricingMode("recent", "unavailable")).toBe("recent");
  });

  it("provides concise user-facing labels for every feed state", () => {
    expect(getFeedStatusLabel("loading")).toBe("Loading");
    expect(getFeedStatusLabel("online")).toBe("Live");
    expect(getFeedStatusLabel("cached")).toBe("Cached");
    expect(getFeedStatusLabel("unavailable")).toBe("Unavailable");
  });
});
