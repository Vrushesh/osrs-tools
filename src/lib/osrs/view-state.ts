import type { SortKey, SortState } from "./table";
import type { PricingMode } from "./types";

export type CalculatorPageSize = 25 | 50 | 100 | "all";

export type CalculatorView = {
  pricingMode: PricingMode;
  search: string;
  includeMembers: boolean;
  hideStale: boolean;
  minLimit: string;
  minVolume: string;
  minProfit: string;
  maxProfit: string;
  minRoi: string;
  pageSize: CalculatorPageSize;
  sort: SortState;
};

export type ParsedCalculatorView = Partial<CalculatorView>;
type NumericViewKey =
  | "minLimit"
  | "minVolume"
  | "minProfit"
  | "maxProfit"
  | "minRoi";

const SORT_KEYS: SortKey[] = [
  "item",
  "buy",
  "highalch",
  "profit",
  "roi",
  "potential",
  "lastUpdated",
  "volume",
];

export function serializeCalculatorView(view: CalculatorView) {
  const params = new URLSearchParams();
  params.set("view", "1");

  if (view.pricingMode !== "recent") params.set("mode", view.pricingMode);
  if (view.search.trim()) params.set("q", view.search.trim());
  if (!view.includeMembers) params.set("members", "f2p");
  if (!view.hideStale) params.set("stale", "show");
  setWhenDifferent(params, "limit", view.minLimit, "");
  setWhenDifferent(params, "volume", view.minVolume, "5");
  setWhenDifferent(params, "profit", view.minProfit, "1");
  setWhenDifferent(params, "profitMax", view.maxProfit, "");
  setWhenDifferent(params, "roi", view.minRoi, "");

  if (view.pageSize !== 100) params.set("rows", String(view.pageSize));
  if (view.sort.key !== "profit" || view.sort.direction !== "desc") {
    params.set("sort", `${view.sort.key}.${view.sort.direction}`);
  }

  return params.toString();
}

export function parseCalculatorViewQuery(search: string): ParsedCalculatorView {
  const params = new URLSearchParams(search);
  const view: ParsedCalculatorView =
    params.get("view") === "1"
      ? {
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
        }
      : {};

  if (params.get("mode") === "stable") view.pricingMode = "stable";

  const query = params.get("q")?.trim();
  if (query) view.search = query;

  if (params.get("members") === "f2p") view.includeMembers = false;
  if (params.get("stale") === "show") view.hideStale = false;

  assignNumericParam(view, "minLimit", params.get("limit"), 0);
  assignNumericParam(view, "minVolume", params.get("volume"), 0);
  assignNumericParam(view, "minProfit", params.get("profit"));
  assignNumericParam(view, "maxProfit", params.get("profitMax"));
  assignNumericParam(view, "minRoi", params.get("roi"), 0);

  const rows = params.get("rows");
  if (rows === "25" || rows === "50" || rows === "100") {
    view.pageSize = Number(rows) as 25 | 50 | 100;
  } else if (rows === "all") {
    view.pageSize = "all";
  }

  const parsedSort = parseSort(params.get("sort"));
  if (parsedSort) view.sort = parsedSort;

  return view;
}

function setWhenDifferent(
  params: URLSearchParams,
  key: string,
  value: string,
  defaultValue: string,
) {
  if (value !== defaultValue) params.set(key, value);
}

function assignNumericParam(
  view: ParsedCalculatorView,
  key: NumericViewKey,
  rawValue: string | null,
  minimum?: number,
) {
  if (rawValue === null || rawValue.trim() === "") return;
  const value = Number(rawValue);
  if (!Number.isFinite(value) || (minimum !== undefined && value < minimum)) {
    return;
  }

  view[key] = rawValue.trim();
}

function parseSort(value: string | null): SortState | null {
  if (!value) return null;
  const [key, direction, extra] = value.split(".");
  if (extra !== undefined || !isSortKey(key)) return null;
  if (direction !== "asc" && direction !== "desc") return null;
  return { key, direction };
}

function isSortKey(value: string): value is SortKey {
  return SORT_KEYS.includes(value as SortKey);
}
