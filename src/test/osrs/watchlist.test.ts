import { describe, expect, it } from "vitest";
import { parseWatchlistIds, toggleWatchlistId } from "../../lib/osrs/watchlist";

describe("watchlist helpers", () => {
  it("parses numeric item ids and ignores malformed entries", () => {
    expect(parseWatchlistIds("[1,\"2\",null,-3,4.5,2,0]")).toEqual([1, 2]);
  });

  it("returns an empty watchlist for malformed storage", () => {
    expect(parseWatchlistIds("not-json")).toEqual([]);
    expect(parseWatchlistIds(null)).toEqual([]);
  });

  it("toggles item ids without duplicating them", () => {
    expect(toggleWatchlistId([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggleWatchlistId([1, 2, 2], 2)).toEqual([1]);
  });
});
