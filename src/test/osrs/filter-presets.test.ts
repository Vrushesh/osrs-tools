import { describe, expect, it } from "vitest";
import { FILTER_PRESETS, getFilterPresetValues } from "../../lib/osrs/filter-presets";

describe("filter presets", () => {
  it("keeps the useful default focused on fresh profitable traded items", () => {
    expect(getFilterPresetValues("useful")).toEqual({
      includeMembers: true,
      hideStale: true,
      minLimit: "",
      minVolume: "5",
      minProfit: "1",
      maxProfit: "",
    });
  });

  it("offers a bulk preset for higher-volume alch candidates", () => {
    expect(getFilterPresetValues("bulk")).toMatchObject({
      includeMembers: true,
      hideStale: true,
      minLimit: "70",
      minVolume: "25",
      minProfit: "100",
    });
  });

  it("exposes labels for every preset shown in the UI", () => {
    expect(FILTER_PRESETS.map((preset) => preset.id)).toEqual([
      "useful",
      "bulk",
      "f2p",
      "margin",
    ]);
  });
});
