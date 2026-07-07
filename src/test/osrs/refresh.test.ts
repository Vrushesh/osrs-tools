import { describe, expect, it } from "vitest";
import {
  canStartRefresh,
  getRefreshState,
  shouldFetchOnManualRefresh,
} from "../../lib/osrs/refresh";

describe("refresh window", () => {
  it("blocks manual fetches inside the 60 second window", () => {
    const state = getRefreshState(1_000_000, 1_000_014);

    expect(state.secondsSinceFetch).toBe(14);
    expect(state.secondsUntilRefresh).toBe(46);
    expect(shouldFetchOnManualRefresh(state)).toBe(false);
  });

  it("allows manual fetch when the 60 second window has elapsed", () => {
    const state = getRefreshState(1_000_000, 1_000_060);

    expect(state.secondsUntilRefresh).toBe(0);
    expect(shouldFetchOnManualRefresh(state)).toBe(true);
  });

  it("blocks refreshes while a request is already in flight", () => {
    const state = getRefreshState(1_000_000, 1_000_060);

    expect(canStartRefresh(state, true)).toBe(false);
    expect(canStartRefresh(state, false)).toBe(true);
  });
});
