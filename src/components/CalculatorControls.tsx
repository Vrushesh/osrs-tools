import type { PricingMode } from "@/lib/osrs/types";

type PageSize = 25 | 50 | 100 | "all";

type Props = {
  pricingMode: PricingMode;
  setPricingMode: (mode: PricingMode) => void;
  search: string;
  setSearch: (value: string) => void;
  natureRuneCost: number;
  natureRuneSourceText: string;
  setNatureRuneCost: (value: number) => void;
  includeMembers: boolean;
  setIncludeMembers: (value: boolean) => void;
  minLimit: string;
  setMinLimit: (value: string) => void;
  minVolume: string;
  setMinVolume: (value: string) => void;
  minProfit: string;
  setMinProfit: (value: string) => void;
  maxProfit: string;
  setMaxProfit: (value: string) => void;
  pageSize: PageSize;
  setPageSize: (value: PageSize) => void;
  page: number;
  totalPages: number;
  resultStart: number;
  resultEnd: number;
  totalRows: number;
  setPage: (value: number) => void;
  refreshText: string;
  onRefresh: () => void;
};

export function CalculatorControls(props: Props) {
  return (
    <section className="controlsPanel">
      <div className="controlsTop">
        <label className="runeControl">
          <span>Nature Rune price:</span>
          <input
            min="0"
            type="number"
            value={props.natureRuneCost}
            onChange={(event) => props.setNatureRuneCost(Number(event.target.value))}
          />
          <span className="sourceHint">{props.natureRuneSourceText}</span>
        </label>

        <div className="segmented" aria-label="Pricing mode">
          <button
            className={props.pricingMode === "recent" ? "active" : ""}
            onClick={() => props.setPricingMode("recent")}
            type="button"
          >
            Most Recent
          </button>
          <button
            className={props.pricingMode === "stable" ? "active" : ""}
            onClick={() => props.setPricingMode("stable")}
            type="button"
          >
          Stable Pricing
        </button>
        <button disabled title="Official GE pricing is planned after the MVP" type="button">
          Official GE
        </button>
      </div>
      </div>

      <input className="filtersToggleInput" id="filters-toggle" type="checkbox" />
      <label className="filtersToggle" htmlFor="filters-toggle">
        Filters: GE ≥ {props.minLimit || "any"} · Demand ≥{" "}
        {props.minVolume || "any"} · Profit ≥ {props.minProfit || "any"}
      </label>

      <div className="filtersContent">
        <label className="checkControl">
          Include members items
          <input
            checked={props.includeMembers}
            type="checkbox"
            onChange={(event) => props.setIncludeMembers(event.target.checked)}
          />
        </label>

        <label className="compactControl">
          GE Restriction:
          <input
            min="0"
            placeholder="Min"
            type="number"
            value={props.minLimit}
            onChange={(event) => props.setMinLimit(event.target.value)}
          />
        </label>

        <label className="compactControl">
          Demand:
          <input
            min="0"
            placeholder="Min"
            type="number"
            value={props.minVolume}
            onChange={(event) => props.setMinVolume(event.target.value)}
          />
        </label>

        <label className="compactControl">
          Profit:
          <input
            placeholder="Min"
            type="number"
            value={props.minProfit}
            onChange={(event) => props.setMinProfit(event.target.value)}
          />
          <span>-</span>
          <input
            placeholder="Max"
            type="number"
            value={props.maxProfit}
            onChange={(event) => props.setMaxProfit(event.target.value)}
          />
        </label>
      </div>

      <div className="controlsBottom">
        <label className="entriesControl">
          Show
          <select
            value={String(props.pageSize)}
            onChange={(event) => {
              const value = event.target.value;
              props.setPageSize(value === "all" ? "all" : (Number(value) as PageSize));
            }}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All</option>
          </select>
          entries
        </label>

        <input
          aria-label="Search items"
          className="searchInput"
          placeholder="Search..."
          value={props.search}
          onChange={(event) => props.setSearch(event.target.value)}
        />
      </div>

      <div className="refreshRow">
        <button className="refreshButton" onClick={props.onRefresh} type="button">
          Refresh
        </button>
        <span className="refreshText">{props.refreshText}</span>
        <span className="paginationSummary">
          Showing {props.resultStart.toLocaleString()}-
          {props.resultEnd.toLocaleString()} of {props.totalRows.toLocaleString()}
        </span>
        <div className="pager">
          <button
            disabled={props.page <= 1}
            onClick={() => props.setPage(props.page - 1)}
            type="button"
          >
            Previous
          </button>
          <span>
            Page {props.page} of {props.totalPages}
          </span>
          <button
            disabled={props.page >= props.totalPages}
            onClick={() => props.setPage(props.page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
