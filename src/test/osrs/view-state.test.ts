import { describe, expect, it } from "vitest";
import {
  parseCalculatorViewQuery,
  serializeCalculatorView,
} from "../../lib/osrs/view-state";

describe("calculator view state", () => {
  it("round-trips a customized calculator view", () => {
    const query = serializeCalculatorView({
      pricingMode: "stable",
      search: "rune plate",
      includeMembers: false,
      hideStale: false,
      minLimit: "70",
      minVolume: "25",
      minProfit: "250",
      maxProfit: "1500",
      minRoi: "4.5",
      pageSize: 50,
      sort: { key: "roi", direction: "desc" },
    });

    expect(parseCalculatorViewQuery(query)).toEqual({
      pricingMode: "stable",
      search: "rune plate",
      includeMembers: false,
      hideStale: false,
      minLimit: "70",
      minVolume: "25",
      minProfit: "250",
      maxProfit: "1500",
      minRoi: "4.5",
      pageSize: 50,
      sort: { key: "roi", direction: "desc" },
    });
  });

  it("keeps default settings behind a short shared-view marker", () => {
    expect(
      serializeCalculatorView({
        pricingMode: "recent",
        search: "",
        includeMembers: true,
        hideStale: true,
        minLimit: "",
        minVolume: "5",
        minProfit: "1",
        maxProfit: "",
        minRoi: "",
        pageSize: 100,
        sort: { key: "profit", direction: "desc" },
      }),
    ).toBe("view=1");

    expect(parseCalculatorViewQuery("?view=1")).toEqual({
      pricingMode: "recent",
      search: "",
      includeMembers: true,
      hideStale: true,
      minLimit: "",
      minVolume: "5",
      minProfit: "1",
      maxProfit: "",
      minRoi: "",
      pageSize: 100,
      sort: { key: "profit", direction: "desc" },
    });
  });

  it("ignores malformed and unsupported query values", () => {
    expect(
      parseCalculatorViewQuery(
        "?mode=official&limit=-1&volume=lots&roi=NaN&rows=500&sort=unknown.asc",
      ),
    ).toEqual({});
  });

  it("accepts negative profit thresholds while guarding nonnegative filters", () => {
    expect(
      parseCalculatorViewQuery("?profit=-250&profitMax=900&limit=0&volume=0&roi=0"),
    ).toEqual({
      minProfit: "-250",
      maxProfit: "900",
      minLimit: "0",
      minVolume: "0",
      minRoi: "0",
    });
  });
});
